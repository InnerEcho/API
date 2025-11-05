import db from "../models/index.js";
import redisClient from "../config/redis.config.js";
const {
  ChatHistory
} = db;
const CACHE_EXPIRATION_SECONDS = 3600;

/**
 * 🌱 PlantChatHistoryService
 * - 식물 챗봇 대화 이력을 조회하는 전용 서비스
 */
export class ChatHistoryService {
  /**
   * DB 데이터를 API 응답 형식으로 변환
   */
  convertDbToMessage(dbData) {
    return {
      userId: dbData.user_id,
      plantId: dbData.plant_id,
      message: dbData.message,
      sendDate: dbData.send_date,
      userType: dbData.user_type
    };
  }

  /**
   * 특정 사용자와 식물 간의 대화 이력 조회
   */
  async getChatHistory(userId, plantId) {
    const cacheKey = `chat-history:${userId}:${plantId}`;

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
    const chatHistoryDb = await ChatHistory.findAll({
      where: {
        user_id: userId,
        plant_id: plantId
      },
      order: [['send_date', 'ASC']],
      raw: true
    });

    // 3. DB 데이터를 IMessage 형식으로 변환
    const chatHistory = chatHistoryDb.map(item => this.convertDbToMessage(item));

    // 4. 변환된 데이터를 Redis에 캐싱
    try {
      await redisClient.setex(cacheKey, CACHE_EXPIRATION_SECONDS, JSON.stringify(chatHistory));
    } catch (error) {
      console.error('Redis SETEX Error:', error);
    }
    return chatHistory;
  }

  /**
   * 오늘의 대화 이력 조회
   */
  async getTodayHistory(userId, plantId) {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const cacheKey = `chat-history:today:${userId}:${plantId}:${today}`;

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
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const resultsDb = await ChatHistory.findAll({
      where: {
        user_id: userId,
        plant_id: plantId,
        send_date: {
          [db.Sequelize.Op.gte]: todayStart
        }
      },
      order: [['send_date', 'ASC']],
      raw: true
    });

    // 3. DB 데이터를 IMessage 형식으로 변환
    const results = resultsDb.map(item => this.convertDbToMessage(item));

    // 4. 오늘의 대화는 더 짧은 만료 시간 설정 (5분)
    try {
      await redisClient.setex(cacheKey, 300, JSON.stringify(results));
    } catch (error) {
      console.error('Redis SETEX Error:', error);
    }
    return results;
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