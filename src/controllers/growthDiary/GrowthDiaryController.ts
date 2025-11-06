import type { Request, Response } from 'express';
import type { ApiResult } from '@/interface/index.js';
import { GrowthDiaryService } from '@/services/growthDiary/GrowthDiaryService.js';

export class GrowthDiaryController {
  private growthDiaryService: GrowthDiaryService;

  constructor(growthDiaryService: GrowthDiaryService) {
    this.growthDiaryService = growthDiaryService;
  }

  public async getDiaryDatesForMonth(
    req: Request,
    res: Response,
  ): Promise<void> {
    const result: ApiResult = { code: 400, data: null, msg: 'Failed' };
    try {
      const userId = req.user!.userId;
      const { yearMonth } = req.params;

      if (!yearMonth || !/^\d{4}-\d{2}$/.test(yearMonth)) {
        result.code = 400;
        result.msg = 'Invalid or missing parameters';
        res.status(400).json(result);
        return;
      }

      const diaries = await this.growthDiaryService.getDiaryDatesForMonth(
        userId,
        yearMonth,
      );
      result.code = 200;
      result.msg = 'Ok';
      result.data = { diaries }; // 일기 정보 리스트 반환 (diaryId, date, title, contentPreview, edited, createdAt)
      res.status(200).json(result);
    } catch (err) {
      console.error('Error in getDiaryDatesForMonth:', err);
      result.code = 500;
      result.msg = 'ServerError';
      res.status(500).json(result);
    }
  }

  public async getDiaryById(req: Request, res: Response): Promise<void> {
    const result: ApiResult = { code: 400, data: null, msg: 'Failed' };

    try {
      const userId = req.user!.userId;
      const diaryId = parseInt(req.params.diaryId, 10);

      if (isNaN(diaryId)) {
        result.code = 400;
        result.msg = 'Invalid diary ID';
        res.status(400).json(result);
        return;
      }

      const response = await this.growthDiaryService.getDiaryById(
        userId,
        diaryId,
      );

      result.code = 200;
      result.data = response;
      result.msg = 'Ok';
      res.status(200).json(result);
    } catch (err: any) {
      console.error(err);
      if (err.message === 'Diary not found') {
        result.code = 404;
        result.msg = 'Diary not found';
        res.status(404).json(result);
      } else {
        result.code = 500;
        result.msg = 'ServerError';
        res.status(500).json(result);
      }
    }
  }

  public async getDiaryByDate(req: Request, res: Response): Promise<void> {
    const result: ApiResult = { code: 400, data: null, msg: 'Failed' };

    try {
      const userId = req.user!.userId;
      const { date } = req.params;
      const response = await this.growthDiaryService.getDiaryByDate(
        userId,
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
      const userId = req.user!.userId;
      const { message, plantId } = req.body;
      const response = await this.growthDiaryService.create(
        userId,
        plantId,
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
