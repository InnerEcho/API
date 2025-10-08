import type { Request, Response } from 'express';
import type { ApiResult } from '@/interface/index.js';
import { ChatHistoryService } from '@/services/ChatHistoryService.js';

export class ChatHistoryController {
  private chatHistoryService: ChatHistoryService;

  constructor(chatHistoryService: ChatHistoryService) {
    this.chatHistoryService = chatHistoryService;
  }

  /**
   * 🌱 채팅 기록 조회
   */
  public async getChatHistory(req: Request, res: Response): Promise<void> {
    const result: ApiResult = { code: 400, data: null, msg: 'Failed' };

    try {
      const userId = req.user!.userId;
      const { plantId } = req.params;
      const response = await this.chatHistoryService.getChatHistory(
        userId,
        parseInt(plantId),
      );

      result.code = 200;
      result.data = response;
      result.msg = 'Ok';
      res.status(200).json(result);
    } catch (err) {
      console.error(err);
      result.code = 500;
      result.msg = 'ServerError';
      res.status(500).json(result);
    }
  }
}
