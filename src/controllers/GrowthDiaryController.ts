import type { Request, Response } from 'express';
import type { ApiResult } from '@/interface/api.js';
import { GrowthDiaryService } from '@/services/GrowthDiaryService.js';
import { GrowthDiaryBot } from '@/services/bots/GrowthDiaryBot.js';

class GrowthDiaryController {
  public async getDiaryByDate(req: Request, res: Response): Promise<void> {
    const result: ApiResult = { code: 400, data: null, msg: 'Failed' };

    try {
      const { user_id, created_date } = req.body;

      const growthDiaryService = new GrowthDiaryService(new GrowthDiaryBot());
      const response = await growthDiaryService.getDiaryByDate(
        user_id,
        created_date,
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
  /**
   * 🌱 식물 챗봇과의 대화 처리
   */
  public async create(req: Request, res: Response): Promise<void> {
    const result: ApiResult = { code: 400, data: null, msg: 'Failed' };

    try {
      const { message, user_id, plant_id } = req.body;
      const chatBot = new GrowthDiaryService(new GrowthDiaryBot());
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
}

export default new GrowthDiaryController();
