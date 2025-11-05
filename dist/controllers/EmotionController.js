import { AnalysisService } from "../services/AnalysisService.js";
import db from "../models/index.js";
export class EmotionController {
  analysisService;
  constructor() {
    this.analysisService = new AnalysisService();
  }

  /**
   * 🌱 채팅 기록 조회 + 유저 감정(state) 가져오기
   */
  async getEmotion(req, res) {
    const result = {
      code: 400,
      data: null,
      msg: 'Failed'
    };
    try {
      const userId = req.user.userId;

      // 사용자 정보 조회 (state 필드 가져오기)
      const user = await db.User.findOne({
        where: {
          user_id: userId
        },
        attributes: ['state'] // state 필드만 조회
      });
      if (!user) {
        result.code = 404;
        result.msg = 'User not found';
        res.status(404).json(result);
        return;
      }
      result.code = 200;
      result.data = {
        emotion: user.state
      }; // 감정 상태를 'emotion' 키로 반환
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
   * 최신 감정 분석 결과 반환 (감정, 문장, 요인)
   */
  async getLatestAnalysis(req, res) {
    const result = {
      code: 400,
      data: null,
      msg: 'Failed'
    };
    try {
      const userId = req.user.userId;
      const latest = await this.analysisService.getLatestUserAnalysis(userId);
      result.code = 200;
      result.msg = latest ? 'Ok' : 'No analysis';
      result.data = latest ? {
        analysisId: latest.analysisId,
        historyId: latest.historyId,
        emotion: latest.emotion,
        message: latest.message,
        factor: latest.factor,
        plantId: latest.plantId,
        analyzedAt: latest.createdAt,
        sendDate: latest.sendDate
      } : null;
      res.status(200).json(result);
    } catch (err) {
      console.error(err);
      result.code = 500;
      result.msg = 'ServerError';
      res.status(500).json(result);
    }
  }
}