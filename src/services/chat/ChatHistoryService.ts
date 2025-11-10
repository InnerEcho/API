import db from '@/models/index.js';
import type { IMessage } from '@/interface/index.js';
import redisClient from '@/config/redis.config.js';
import {
  buildFullHistoryCacheKey,
  buildTodayHistoryCacheKey,
} from '@/services/chat/historyCache.util.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

const { ChatHistory } = db;

const CACHE_EXPIRATION_SECONDS = 3600;

/**
 * 🌱 PlantChatHistoryService
 * - 식물 챗봇 대화 이력을 조회하는 전용 서비스
 */
export class ChatHistoryService {
  /**
   * DB 데이터를 API 응답 형식으로 변환
   */
  private convertDbToMessage(dbData: any): IMessage {
    const plain = typeof dbData.get === 'function' ? dbData.get({ plain: true }) : dbData;
    const analysis = plain.analysis ?? null;

    return {
      userId: plain.user_id,
      plantId: plain.plant_id,
      message: plain.message,
      sendDate: plain.send_date,
      userType: plain.user_type,
      historyId: plain.history_id ?? null,
      emotion: analysis?.emotion ?? null,
      factor: analysis?.factor ?? null,
    };
  }

  /**
   * DB에서 직접 대화 이력을 조회한다.
   * - 공통 포맷 유지
   * - 캐시 미사용
   */
  private async fetchHistoryFromDb(
    userId: number,
    plantId: number,
  ): Promise<IMessage[]> {
    const chatHistoryDb = await ChatHistory.findAll({
      where: { user_id: userId, plant_id: plantId },
      order: [['send_date', 'ASC']],
      include: [
        {
          model: db.ChatAnalysis,
          as: 'analysis',
          attributes: ['emotion', 'factor'],
        },
      ],
    });

    return (chatHistoryDb as any[]).map(item => this.convertDbToMessage(item));
  }

  /**
   * 특정 사용자와 식물 간의 대화 이력 조회
   */
  public async getChatHistory(
    userId: number,
    plantId: number,
  ): Promise<IMessage[]> {
    const cacheKey = buildFullHistoryCacheKey(userId, plantId);

    // 1. Redis 캐시 조회
    try {
      const cachedHistory = await redisClient.get(cacheKey);

      if (cachedHistory) {
        console.log(`[Cache Hit] ${cacheKey}`);
        return JSON.parse(cachedHistory);
      }
    } catch (error) {
      console.error('Redis GET Error:', error);
    }

    // 2. Cache Miss: DB에서 데이터 조회
    console.log(`[Cache Miss] ${cacheKey}`);
    const chatHistory = await this.fetchHistoryFromDb(userId, plantId);

    // 4. 변환된 데이터를 Redis에 캐싱
    try {
      await redisClient.setex(
        cacheKey,
        CACHE_EXPIRATION_SECONDS,
        JSON.stringify(chatHistory),
      );
    } catch (error) {
      console.error('Redis SETEX Error:', error);
    }

    return chatHistory;
  }

  /**
   * API/서비스에서 즉시 최신 이력을 확인해야 할 때 사용
   */
  public async getChatHistoryFromDb(
    userId: number,
    plantId: number,
  ): Promise<IMessage[]> {
    return this.fetchHistoryFromDb(userId, plantId);
  }



  /**
   * 오늘의 대화 이력 조회
   */
  public async getTodayHistory(
    userId: number,
    plantId: number,
  ): Promise<IMessage[]> {
    const { cacheKey, startUtc, endUtc } = this.buildTodayRange(userId, plantId);

    // 1. Redis 캐시 조회
    try {
      const cachedTodayHistory = await redisClient.get(cacheKey);
      if (cachedTodayHistory) {
        console.log(`[Cache Hit] ${cacheKey}`);
        return JSON.parse(cachedTodayHistory);
      }
    } catch (error) {
      console.error('Redis GET Error:', error);
    }

    // 2. Cache Miss: DB에서 오늘 데이터 조회
    console.log(`[Cache Miss] ${cacheKey}`);
    const resultsDb = await ChatHistory.findAll({
      where: {
        user_id: userId,
        plant_id: plantId,
        send_date: {
          [db.Sequelize.Op.gte]: startUtc,
          [db.Sequelize.Op.lt]: endUtc,
        },
      },
      order: [['send_date', 'ASC']],
      include: [
        {
          model: db.ChatAnalysis,
          as: 'analysis',
          attributes: ['emotion', 'factor'],
        },
      ],
    });

    // 3. DB 데이터를 IMessage 형식으로 변환
    const results = (resultsDb as any[]).map(item => this.convertDbToMessage(item));

    // 4. 오늘의 대화는 더 짧은 만료 시간 설정 (5분)
    try {
      await redisClient.setex(cacheKey, 300, JSON.stringify(results));
    } catch (error) {
      console.error('Redis SETEX Error:', error);
    }

    return results;
  }

  private buildTodayRange(userId: number, plantId: number): {
    cacheKey: string;
    startUtc: Date;
    endUtc: Date;
  } {
    const nowKst = dayjs().tz('Asia/Seoul');
    const startUtc = nowKst.startOf('day').utc().toDate();
    const endUtc = nowKst.endOf('day').utc().toDate();
    const cacheKey = buildTodayHistoryCacheKey(
      userId,
      plantId,
      nowKst.format('YYYY-MM-DD'),
    );

    return { cacheKey, startUtc, endUtc };
  }
}


  // public async getChatHistory(
  //   userId: number,
  //   plantId: number,
  // ): Promise<IMessage[]> {
  //   const chatHistory = await ChatHistory.findAll({
  //     where: { user_id: userId, plant_id: plantId },
  //     order: [['send_date', 'ASC']],
  //   });

  //   return chatHistory;
  // }

//   public async getTodayHistory(
//     userId: number,
//     plantId: number,
//   ): Promise<IMessage[]> {
//     const todayStart = new Date();
//     todayStart.setHours(0, 0, 0, 0);

//     const startDateStr = todayStart
//       .toISOString()
//       .slice(0, 19)
//       .replace('T', ' ');

//     const query = `
//       SELECT * FROM plant_history
//       WHERE user_id = ${userId}
//         AND plant_id = ${plantId}
//         AND send_date >= '${startDateStr}'
//       ORDER BY send_date ASC
//     `;

//     const results = await db.sequelize.query(query, {
//       replacements: {
//         user_id: userId,
//         plant_id: plantId,
//         startDate: startDateStr,
//       },
//       type: db.Sequelize.QueryTypes.SELECT,
//     });

//     return results as IMessage[];
//   }
// }
