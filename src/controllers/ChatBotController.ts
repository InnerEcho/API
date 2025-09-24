import type { Request, Response } from 'express';
import type { ApiResult } from '@/interface/api.js';
import { ChatService } from '@/services/ChatService.js';
import { ChatBot } from '@/services/bots/ChatBot.js';

export class PlantChatBotController {
  private chatService: ChatService;

  constructor(chatService: ChatService) {
    this.chatService = chatService;
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
  // state 저장 호출
  async emotionSave(req: Request, res: Response) {
    try {
      const { user_id, plant_id, message, emotion } = req.body;

      // ChatService의 create 메서드 호출
      await this.chatService.create(user_id, plant_id, message, emotion);

      // 필요하다면 추가 로직 및 응답 처리
      res.status(200).json({ code: 200, msg: 'Success' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ code: 500, msg: 'Server Error' });
    }
  }

}
