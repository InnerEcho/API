import { Request, Response } from 'express';
import { ApiResult } from '../interface/api.js';
import PlantChatHistoryService from '../services/ChatHistoryService.js';
import { ChatService } from '../services/ChatService.js';
import { ChatBot } from '../services/bots/ChatBot.js';

class PlantChatBotController {
  /**
   * 🌱 식물 챗봇과의 대화 처리
   */
  public async chat(req: Request, res: Response): Promise<void> {
    const result: ApiResult = { code: 400, data: null, msg: 'Failed' };

    try {
      const { message, user_id, plant_id } = req.body;
      const chatBot = new ChatService(new ChatBot());
      const response = await chatBot.create(user_id, plant_id, message);

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

  /**
   * 🌱 채팅 기록 조회
   */
  public async getChatHistory(req: Request, res: Response): Promise<void> {
    try {
      const { user_id, plant_id } = req.body;
      const histories = await PlantChatHistoryService.getChatHistory(
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

export default new PlantChatBotController();
