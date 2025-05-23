import db from '@/models/index.js';
import type { IMessage } from '@/interface/chatbot.js';

const { ChatHistory } = db;

/**
 * 🌱 PlantChatHistoryService
 * - 식물 챗봇 대화 이력을 조회하는 전용 서비스
 */
export class ChatHistoryService {
  /**
   * 특정 사용자와 식물 간의 대화 이력 조회
   */
  public async getChatHistory(
    userId: number,
    plantId: number,
  ): Promise<IMessage[]> {
    return ChatHistory.findAll({
      where: { user_id: userId, plant_id: plantId },
      order: [['send_date', 'ASC']],
    });
  }

  public async getTodayHistory(
    userId: number,
    plantId: number,
  ): Promise<IMessage[]> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const startDateStr = todayStart
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ');

    const query = `
      SELECT * FROM plant_history
      WHERE user_id = :userId
        AND plant_id = :plantId
        AND send_date >= :startDate
      ORDER BY send_date ASC
    `;

    const results = await db.sequelize.query(query, {
      replacements: { userId, plantId, startDate: startDateStr },
      type: db.Sequelize.QueryTypes.SELECT,
    });

    return results as IMessage[];
  }
}
