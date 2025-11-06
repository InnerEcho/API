import type { Request, Response } from 'express';
import type { ApiResult } from '@/interface/index.js';
import { AnalysisService } from '@/services/analysis/AnalysisService.js';

export class EmotionController {
  private analysisService: AnalysisService;

  constructor() {
    this.analysisService = new AnalysisService();
  }

  /**
   * 🌱 채팅 기록 조회 + 유저 감정(state) 가져오기
   */
  public async getEmotion(req: Request, res: Response): Promise<void> {
    const result: ApiResult = { code: 400, data: null, msg: 'Failed' };

    try {
      const userId = req.user!.userId;
      const latest = await this.analysisService.getLatestUserAnalysis(userId);
      result.code = 200;
      result.msg = latest ? 'Ok' : 'No analysis';
      result.data = { emotion: latest?.emotion ?? null };
      res.status(200).json(result);
    } catch (err) {
      console.error(err);
      result.code = 500;
      result.msg = 'ServerError';
      res.status(500).json(result);
    }
  }

  /**
   * 최신 감정 분석 결과 반환 (감정, 문장, 요인)
   */
  public async getLatestAnalysis(req: Request, res: Response): Promise<void> {
    const result: ApiResult = { code: 400, data: null, msg: 'Failed' };

    try {
      const userId = req.user!.userId;
      const latest = await this.analysisService.getLatestUserAnalysis(userId);

      result.code = 200;
      result.msg = latest ? 'Ok' : 'No analysis';
      result.data = latest
        ? {
            analysisId: latest.analysisId,
            historyId: latest.historyId,
            emotion: latest.emotion,
            message: latest.message,
            factor: latest.factor,
            plantId: latest.plantId,
            analyzedAt: latest.createdAt,
            sendDate: latest.sendDate,
          }
        : null;

      res.status(200).json(result);
    } catch (err) {
      console.error(err);
      result.code = 500;
      result.msg = 'ServerError';
      res.status(500).json(result);
    }
  }

  /**
   * 최근 한 달 감정 분석 기록 반환 (배열)
   */
  public async getMonthlyAnalyses(
    req: Request,
    res: Response,
  ): Promise<void> {
    const result: ApiResult = { code: 400, data: null, msg: 'Failed' };

    try {
      const userId = req.user!.userId;
      const analyses =
        await this.analysisService.getUserAnalysesForLastMonth(userId);

      result.code = 200;
      result.msg = analyses.length > 0 ? 'Ok' : 'No analysis';
      result.data = analyses.map(analysis => ({
        analysisId: analysis.analysisId,
        historyId: analysis.historyId,
        emotion: analysis.emotion,
        message: analysis.message,
        factor: analysis.factor,
        plantId: analysis.plantId,
        analyzedAt: analysis.createdAt,
        sendDate: analysis.sendDate,
      }));

      res.status(200).json(result);
    } catch (err) {
      console.error(err);
      result.code = 500;
      result.msg = 'ServerError';
      res.status(500).json(result);
    }
  }
}
