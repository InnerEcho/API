import { RealtimeSpeechService } from "../services/RealtimeSpeechService.js";
export class RealtimeSpeechController {
  constructor() {
    this.realtimeSpeechService = new RealtimeSpeechService();
  }

  /**
   * WebRTC 세션 생성 및 ephemeral token 발급
   * POST /chat/realtime/session
   */
  async createSession(req, res) {
    try {
      const userId = req.user?.userId;
      const {
        plantId
      } = req.body;
      if (!userId) {
        res.status(401).json({
          code: 401,
          message: '인증이 필요합니다.'
        });
        return;
      }
      if (!plantId) {
        res.status(400).json({
          code: 400,
          message: 'plantId가 필요합니다.'
        });
        return;
      }
      console.log(`🎙️ WebRTC 세션 생성 요청: userId=${userId}, plantId=${plantId}`);

      // OpenAI WebRTC 세션 생성 및 ephemeral token 발급
      const session = await this.realtimeSpeechService.createWebRTCSession(userId, plantId);
      res.status(200).json({
        code: 200,
        message: 'WebRTC session created successfully',
        data: {
          ephemeralToken: session.ephemeralToken,
          expiresAt: session.expiresAt,
          sessionId: session.sessionId,
          expiresIn: 60 // 60초 (OpenAI 기본값)
        }
      });
    } catch (error) {
      console.error('❌ WebRTC 세션 생성 실패:', error);
      res.status(500).json({
        code: 500,
        message: error instanceof Error ? error.message : '서버 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 대화 히스토리 저장
   * POST /chat/realtime/history
   */
  async saveChatHistory(req, res) {
    try {
      const userId = req.user?.userId;
      const {
        plantId,
        userMessage,
        assistantMessage
      } = req.body;
      if (!userId) {
        res.status(401).json({
          code: 401,
          message: '인증이 필요합니다.'
        });
        return;
      }
      if (!plantId) {
        res.status(400).json({
          code: 400,
          message: 'plantId가 필요합니다.'
        });
        return;
      }
      await this.realtimeSpeechService.saveChatHistory(userId, plantId, userMessage, assistantMessage);
      res.status(200).json({
        code: 200,
        message: 'Chat history saved successfully'
      });
    } catch (error) {
      console.error('❌ 대화 히스토리 저장 실패:', error);
      res.status(500).json({
        code: 500,
        message: error instanceof Error ? error.message : '서버 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 대화 히스토리 조회
   * GET /chat/realtime/history/:plantId
   */
  async getChatHistory(req, res) {
    try {
      const userId = req.user?.userId;
      const plantId = parseInt(req.params.plantId, 10);
      if (!userId) {
        res.status(401).json({
          code: 401,
          message: '인증이 필요합니다.'
        });
        return;
      }
      if (isNaN(plantId)) {
        res.status(400).json({
          code: 400,
          message: '올바른 plantId가 필요합니다.'
        });
        return;
      }
      const history = await this.realtimeSpeechService.getChatHistory(userId, plantId);
      res.status(200).json({
        code: 200,
        message: 'Ok',
        data: {
          history
        }
      });
    } catch (error) {
      console.error('❌ 대화 히스토리 조회 실패:', error);
      res.status(500).json({
        code: 500,
        message: error instanceof Error ? error.message : '서버 오류가 발생했습니다.'
      });
    }
  }
}