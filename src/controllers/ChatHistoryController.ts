import type { Request, Response } from 'express';
import { ChatHistoryService } from '../services/ChatHistoryService.js';

class ChatHistoryController {
  private chatHistoryService: ChatHistoryService;

  constructor(chatHistoryService: ChatHistoryService) {
    this.chatHistoryService = chatHistoryService;
  }

  /**
   * 🌱 채팅 기록 조회
   */
  public async getChatHistory(req: Request, res: Response): Promise<void> {
    try {
      const { user_id, plant_id } = req.body;

      const histories = await this.chatHistoryService.getChatHistory(
        user_id,
        plant_id,
      );

      res.status(200).json({ code: 200, data: histories, msg: 'Ok' });
    } catch (error) {
      console.error('Error fetching chat history:', error);

      res
        .status(500)
        .json({ success: false, message: 'Failed to fetch chat history' });
    }
  }
}

export default new ChatHistoryController(new ChatHistoryService());
