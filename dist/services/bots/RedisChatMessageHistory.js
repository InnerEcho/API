import { BaseChatMessageHistory } from '@langchain/core/chat_history';
import { AIMessage, HumanMessage, mapChatMessagesToStoredMessages } from '@langchain/core/messages';
import redisClient from "../../config/redis.config.js";
import db from "../../models/index.js";
import { AnalysisService } from "../AnalysisService.js";
const {
  ChatHistory
} = db;
const analysisService = new AnalysisService();
export class RedisChatMessageHistory extends BaseChatMessageHistory {
  lc_namespace = ['langchain', 'stores', 'message', 'redis'];
  userId;
  plantId;
  sessionKey;
  TTL = 24 * 60 * 60; // 24시간

  constructor(userId, plantId) {
    super();
    this.userId = userId;
    this.plantId = plantId;
    this.sessionKey = `chat:${userId}:${plantId}`;
  }

  /**
   * Redis에서 히스토리를 가져오고, 없으면 DB에서 로드합니다.
   */
  async getMessages() {
    try {
      // 1. Redis에서 먼저 조회
      const cached = await redisClient.lrange(this.sessionKey, 0, -1);
      if (cached && cached.length > 0) {
        // Redis에 캐시가 있으면 파싱하여 반환
        return cached.map(item => {
          const parsed = JSON.parse(item);
          if (parsed.type === 'human') {
            return new HumanMessage(parsed.content);
          } else {
            return new AIMessage(parsed.content);
          }
        });
      }

      // 2. Redis에 없으면 DB에서 조회
      const histories = await ChatHistory.findAll({
        where: {
          user_id: this.userId,
          plant_id: this.plantId
        },
        order: [['send_date', 'DESC']],
        limit: 20
      });
      if (histories.length === 0) {
        return [];
      }
      const reversedHistories = histories.reverse();
      const messages = reversedHistories.map(history => {
        if (history.user_type === 'User') {
          return new HumanMessage(history.message);
        } else {
          return new AIMessage(history.message);
        }
      });

      // 3. DB에서 가져온 데이터를 Redis에 캐싱
      const pipeline = redisClient.pipeline();
      messages.forEach(msg => {
        const serialized = JSON.stringify({
          type: msg instanceof HumanMessage ? 'human' : 'ai',
          content: msg.content
        });
        pipeline.rpush(this.sessionKey, serialized);
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
  async addMessage(message) {
    await this.addMessages([message]);
  }

  /**
   * 사용자 메시지를 추가합니다.
   */
  async addUserMessage(message) {
    await this.addMessage(new HumanMessage(message));
  }

  /**
   * AI 메시지를 추가합니다.
   */
  async addAIChatMessage(message) {
    await this.addMessage(new AIMessage(message));
  }

  /**
   * 새로운 메시지들을 Redis에 즉시 저장하고, DB에 비동기로 백업합니다.
   */
  async addMessages(messages) {
    try {
      // 1. Redis에 즉시 저장 (빠른 응답)
      const pipeline = redisClient.pipeline();
      messages.forEach(msg => {
        const serialized = JSON.stringify({
          type: msg instanceof HumanMessage ? 'human' : 'ai',
          content: msg.content
        });
        pipeline.rpush(this.sessionKey, serialized);
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
  async saveToDatabase(messages) {
    const storedMessages = mapChatMessagesToStoredMessages(messages);
    for (const message of storedMessages) {
      const payload = {
        user_id: this.userId,
        plant_id: this.plantId,
        message: message.data.content,
        user_type: message.type === 'human' ? 'User' : 'Bot',
        send_date: new Date()
      };
      const record = await ChatHistory.create(payload);
      if (payload.user_type === 'User') {
        const rawHistoryId = record.get('history_id');
        const historyIdNumber = Number(rawHistoryId);
        if (!Number.isNaN(historyIdNumber)) {
          try {
            await analysisService.analyzeAndStore({
              historyId: historyIdNumber,
              userId: this.userId,
              message: payload.message,
              userType: 'User'
            });
          } catch (error) {
            console.error('RedisChatMessageHistory: analysis store failed', error);
          }
        }
      }
    }
  }

  /**
   * 해당 유저와 식물의 대화 기록을 모두 삭제합니다.
   */
  async clear() {
    try {
      // Redis 삭제
      await redisClient.del(this.sessionKey);

      // DB 삭제
      await ChatHistory.destroy({
        where: {
          user_id: this.userId,
          plant_id: this.plantId
        }
      });
    } catch (error) {
      console.error('메시지를 삭제하는 중 오류 발생:', error);
      throw error;
    }
  }
}