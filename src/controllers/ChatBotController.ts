import type { Request, Response } from 'express';
import type { ApiResult } from '@/interface/api.js';
import { ChatService } from '@/services/ChatService.js';
import { ChatBot } from '@/services/bots/ChatBot.js';

class PlantChatBotController {
  private chatService: ChatService;

  constructor(chatServcie: ChatService) {
    this.chatService = chatServcie;
  }
  /**
   * 🌱 식물 챗봇과의 대화 처리
   */
  public async chat(req: Request, res: Response): Promise<void> {
    const result: ApiResult = { code: 400, data: null, msg: 'Failed' };

    try {
      const { message, user_id, plant_id } = req.body;
      const response = await this.chatService.create(
        user_id,
        plant_id,
        message,
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

export default new PlantChatBotController(new ChatService(new ChatBot()));
