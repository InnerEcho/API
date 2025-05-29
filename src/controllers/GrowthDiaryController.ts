import type { Request, Response } from 'express';
import type { ApiResult } from '@/interface/api.js';
import { GrowthDiaryService } from '@/services/GrowthDiaryService.js';
import { GrowthDiaryBot } from '@/services/bots/GrowthDiaryBot.js';

class GrowthDiaryController {
  private growthDiaryService: GrowthDiaryService;

  constructor(growthDiaryService: GrowthDiaryService) {
    this.growthDiaryService = growthDiaryService;
  }

  public async getDiaryByDate(req: Request, res: Response): Promise<void> {
    const result: ApiResult = { code: 400, data: null, msg: 'Failed' };

    try {
      const { user_id, created_date } = req.body;
      const response = await this.growthDiaryService.getDiaryByDate(
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
   * 지금은 openai 한번만 돌리는데 성장일지 작성자 + 성장일지 작성 평가자로 나눠서 작성하는 방식이 좋을듯듯
   */
  public async create(req: Request, res: Response): Promise<void> {
    const result: ApiResult = { code: 400, data: null, msg: 'Failed' };

    try {
      const { message, user_id, plant_id } = req.body;
      const response = await this.growthDiaryService.create(
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

export default new GrowthDiaryController(
  new GrowthDiaryService(new GrowthDiaryBot()),
);
