import type { Request, Response } from 'express';
import type { ApiResult } from '@/interface/api.js';
import { GrowthDiaryService } from '@/services/GrowthDiaryService.js';
import { GrowthDiaryBot } from '@/services/bots/GrowthDiaryBot.js';

export class GrowthDiaryController {
  private growthDiaryService: GrowthDiaryService;

  constructor(growthDiaryService: GrowthDiaryService) {
    this.growthDiaryService = growthDiaryService;
  }

public async getDiaryDatesForMonth(req: Request, res: Response): Promise<void> {
    const result:ApiResult = { code: 400, data: null, msg: 'Failed' };
    try {
      const { user_id, year_month } = req.params;

      if (!user_id || !year_month || !/^\d{4}-\d{2}$/.test(year_month)) {
        result.code = 400;
        result.msg = 'Invalid or missing parameters';
        res.status(400).json(result);
        return;
      }
 
      const numericUserId = parseInt(user_id, 10); 
      
      const dates = await this.growthDiaryService.getDiaryDatesForMonth(numericUserId, year_month);
      result.code = 200;
      result.msg = 'Ok';
      result.data = { dates }; // 날짜 리스트 반환
      res.status(200).json(result);
    } catch (err) {
      console.error('Error in getDiaryDatesForMonth:', err);
      result.code = 500;
      result.msg = 'ServerError';
      res.status(500).json(result);
    }
  }
  

  public async getDiaryByDate(req: Request, res: Response): Promise<void> {
    const result: ApiResult = { code: 400, data: null, msg: 'Failed' };

    try {
      const { user_id, date } = req.params;
      const response = await this.growthDiaryService.getDiaryByDate(
        parseInt(user_id),
        date,
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
