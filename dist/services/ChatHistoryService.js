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
   * 특정 사용자와 식물 간의 대화 이력 조회
   */
  async getChatHistory(userId, plantId) {
    const cacheKey = `chat-history:${userId}:${plantId}`;
    try {
      const cachedHistory = await redisClient.get(cacheKey);
      if (cachedHistory) {
        console.log(`[Cache Hit] ${cacheKey}`);
        return JSON.parse(cachedHistory); // 캐시된 데이터가 있으면 파싱하여 반환
      }
    } catch (error) {
      console.error('Redis GET Error:', error);
    }
    // 4. Cache Miss: DB에서 데이터 조회
    console.log(`[Cache Miss] ${cacheKey}`);
    const chatHistory = await ChatHistory.findAll({
      where: {
        user_id: userId,
        plant_id: plantId
      },
      order: [['send_date', 'ASC']],
      raw: true // lean object로 받기
    });
    try {
      // 5. DB 조회 결과를 Redis에 저장 (JSON 문자열 형태로)
      // SETEX: 키에 값을 저장하고 만료 시간을 설정
      await redisClient.setex(cacheKey, CACHE_EXPIRATION_SECONDS, JSON.stringify(chatHistory));
    } catch (error) {
      console.error('Redis SETEX Error:', error);
    }
    return chatHistory;
  }
  async getTodayHistory(userId, plantId) {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const cacheKey = `chat-history:today:${userId}:${plantId}:${today}`;
    try {
      const cachedTodayHistory = await redisClient.get(cacheKey);
      if (cachedTodayHistory) {
        console.log(`[Cache Hit] ${cacheKey}`);
        return JSON.parse(cachedTodayHistory);
      }
    } catch (error) {
      console.error('Redis GET Error:', error);
    }
    console.log(`[Cache Miss] ${cacheKey}`);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const results = await ChatHistory.findAll({
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
    try {
      // 오늘의 대화는 더 짧은 만료시간 설정 가능 (예: 5분)
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