import type { Request, Response } from 'express';
import type { ApiResult } from '@/interface/index.js';
import { ChatService } from '@/services/chat/ChatService.js';

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
      //파라미터 값 받기
      const userId = req.user!.userId;

      const { message, plantId } = req.body;
      
      //챗봇 응답 생성
      const response = await this.chatService.create(userId, plantId, message);

      //결과 반환
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
