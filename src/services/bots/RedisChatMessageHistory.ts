import { BaseChatMessageHistory } from '@langchain/core/chat_history';
import {
  AIMessage,
  HumanMessage,
  BaseMessage,
  mapChatMessagesToStoredMessages,
} from '@langchain/core/messages';
import redisClient from '@/config/redis.config.js';
import db from '@/models/index.js';
import { AnalysisService } from '@/services/analysis/AnalysisService.js';

const { ChatHistory } = db;
const analysisService = new AnalysisService();

type StoredMessagePayload = {
  type: 'human' | 'ai';
  content: string;
  analysis?: {
    historyId: number | null;
    emotion: string | null;
    factor: string | null;
  };
};

export class RedisChatMessageHistory extends BaseChatMessageHistory {
  lc_namespace = ['langchain', 'stores', 'message', 'redis'];
  private userId: number;
  private plantId: number;
  private sessionKey: string;
  private readonly TTL = 24 * 60 * 60; // 24시간

  constructor(userId: number, plantId: number) {
    super();
    this.userId = userId;
    this.plantId = plantId;
    this.sessionKey = `chat:${userId}:${plantId}`;
  }

  /**
   * Redis에서 히스토리를 가져오고, 없으면 DB에서 로드합니다.
   */
  async getMessages(): Promise<BaseMessage[]> {
    try {
      // 1. Redis에서 먼저 조회
      const cached = await redisClient.lrange(this.sessionKey, 0, -1);

      if (cached && cached.length > 0) {
        // Redis에 캐시가 있으면 파싱하여 반환
        return cached
          .map(item => this.deserializeMessage(item))
          .filter((message): message is BaseMessage => message !== null);
      }

      // 2. Redis에 없으면 DB에서 조회
      const histories = await ChatHistory.findAll({
        where: {
          user_id: this.userId,
          plant_id: this.plantId,
        },
        include: [
          {
            model: db.ChatAnalysis,
            as: 'analysis',
            attributes: ['emotion', 'factor'],
          },
        ],
        order: [['send_date', 'DESC']],
        limit: 20,
      });

      if (histories.length === 0) {
        return [];
      }

      const messages = this.mapHistoriesToMessages(histories);

      // 3. DB에서 가져온 데이터를 Redis에 캐싱
      const pipeline = redisClient.pipeline();
      messages.forEach(msg => {
        pipeline.rpush(this.sessionKey, this.serializeMessage(msg));
      });
      pipeline.expire(this.sessionKey, this.TTL);
      await pipeline.exec();

      return messages;
    } catch (error) {
      console.error('Redis/DB에서 메시지를 가져오는 중 오류 발생:', error);
      throw error;
    }
  }

  /**
   * 단일 메시지를 추가합니다.
   */
  async addMessage(message: BaseMessage): Promise<void> {
    await this.addMessages([message]);
  }

  /**
   * 사용자 메시지를 추가합니다.
   */
  async addUserMessage(message: string): Promise<void> {
    await this.addMessage(new HumanMessage(message));
  }

  /**
   * AI 메시지를 추가합니다.
   */
  async addAIChatMessage(message: string): Promise<void> {
    await this.addMessage(new AIMessage(message));
  }

  /**
   * 새로운 메시지들을 Redis에 즉시 저장하고, DB에 비동기로 백업합니다.
   */
  async addMessages(messages: BaseMessage[]): Promise<void> {
    try {
      // 1. Redis에 즉시 저장 (빠른 응답)
      const pipeline = redisClient.pipeline();
      messages.forEach(msg => {
        pipeline.rpush(this.sessionKey, this.serializeMessage(msg));
      });
      pipeline.expire(this.sessionKey, this.TTL);
      await pipeline.exec();

      // 2. DB에 비동기로 백업 (await 없이 fire-and-forget)
      this.saveToDatabase(messages).catch(error => {
        console.error('DB 백업 중 오류 발생:', error);
      });
    } catch (error) {
      console.error('Redis에 메시지를 추가하는 중 오류 발생:', error);
      throw error;
    }
  }

  /**
   * DB에 메시지를 저장합니다 (비동기 백업용)
   */
  private async saveToDatabase(messages: BaseMessage[]): Promise<void> {
    const storedMessages = mapChatMessagesToStoredMessages(messages);

    for (const message of storedMessages as any[]) {
      const payload = {
        user_id: this.userId,
        plant_id: this.plantId,
        message: message.data.content,
        user_type: message.type === 'human' ? 'User' : 'Bot',
        send_date: new Date(),
      };

      const record = await ChatHistory.create(payload);

      if (payload.user_type === 'User') {
        const rawHistoryId = record.get('history_id') as number | string | bigint;
        const historyIdNumber = Number(rawHistoryId);

        if (!Number.isNaN(historyIdNumber)) {
          try {
            await analysisService.analyzeAndStore({
              historyId: historyIdNumber,
              userId: this.userId,
              message: payload.message,
              userType: 'User',
            });
          } catch (error) {
            console.error('RedisChatMessageHistory: analysis store failed', error);
          }
        }
      }
    }

    await this.refreshRedisCache();
  }

  /**
   * 해당 유저와 식물의 대화 기록을 모두 삭제합니다.
   */
  async clear(): Promise<void> {
    try {
      // Redis 삭제
      await redisClient.del(this.sessionKey);

      // DB 삭제
      await ChatHistory.destroy({
        where: {
          user_id: this.userId,
          plant_id: this.plantId,
        },
      });
    } catch (error) {
      console.error('메시지를 삭제하는 중 오류 발생:', error);
      throw error;
    }
  }

  private deserializeMessage(item: string): BaseMessage | null {
    try {
      const parsed: StoredMessagePayload = JSON.parse(item);
      const content =
        typeof parsed.content === 'string'
          ? parsed.content
          : String(parsed.content);

      if (parsed.type === 'human') {
        const analysis = parsed.analysis;
        return new HumanMessage({
          content,
          additional_kwargs: analysis ? { analysis } : {},
        });
      }

      if (parsed.type === 'ai') {
        return new AIMessage(content);
      }

      return null;
    } catch (error) {
      console.error('RedisChatMessageHistory: failed to deserialize message', error);
      return null;
    }
  }

  private mapHistoriesToMessages(histories: any[]): BaseMessage[] {
    return [...histories]
      .reverse()
      .map(history => {
        const analysis = history.get('analysis') as
          | { emotion?: string | null; factor?: string | null }
          | null;
        const rawHistoryId = history.get('history_id') as number | string | bigint | null;
        const historyIdNumber = rawHistoryId === null ? null : Number(rawHistoryId);
        const safeHistoryId =
          historyIdNumber !== null && !Number.isNaN(historyIdNumber)
            ? historyIdNumber
            : null;

        if (history.user_type === 'User') {
          const analysisPayload = {
            historyId: safeHistoryId,
            emotion: analysis?.emotion ?? null,
            factor: analysis?.factor ?? null,
          };

          return new HumanMessage({
            content: history.message,
            additional_kwargs: { analysis: analysisPayload },
          });
        }

        return new AIMessage(history.message);
      });
  }

  private serializeMessage(message: BaseMessage): string {
    const basePayload: StoredMessagePayload = {
      type: message instanceof HumanMessage ? 'human' : 'ai',
      content:
        typeof message.content === 'string'
          ? message.content
          : JSON.stringify(message.content),
    };

    if (message instanceof HumanMessage) {
      const analysis = message.additional_kwargs?.analysis as
        | StoredMessagePayload['analysis']
        | undefined;

      if (analysis) {
        basePayload.analysis = {
          historyId:
            analysis.historyId !== undefined && analysis.historyId !== null
              ? Number(analysis.historyId)
              : null,
          emotion: analysis.emotion ?? null,
          factor: analysis.factor ?? null,
        };
      }
    }

    return JSON.stringify(basePayload);
  }

  private async refreshRedisCache(): Promise<void> {
    try {
      const histories = await ChatHistory.findAll({
        where: {
          user_id: this.userId,
          plant_id: this.plantId,
        },
        include: [
          {
            model: db.ChatAnalysis,
            as: 'analysis',
            attributes: ['emotion', 'factor'],
          },
        ],
        order: [['send_date', 'DESC']],
        limit: 20,
      });

      const messages = this.mapHistoriesToMessages(histories);
      const pipeline = redisClient.pipeline();
      pipeline.del(this.sessionKey);
      messages.forEach(msg => {
        pipeline.rpush(this.sessionKey, this.serializeMessage(msg));
      });
      pipeline.expire(this.sessionKey, this.TTL);
      await pipeline.exec();
    } catch (error) {
      console.error('RedisChatMessageHistory: failed to refresh cache', error);
    }
  }
}
