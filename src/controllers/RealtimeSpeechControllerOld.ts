import type { Request } from 'express';
import WebSocket from 'ws';
import { RealtimeSpeechServiceOld } from '@/services/RealtimeSpeechServiceOld.js';

export class RealtimeSpeechControllerOld {
  private realtimeSpeechService: RealtimeSpeechServiceOld;

  constructor() {
    this.realtimeSpeechService = new RealtimeSpeechServiceOld();
  }

  /**
   * WebSocket 연결을 통한 실시간 음성 대화 처리
   * @param ws - 클라이언트 WebSocket 연결
   * @param req - Express 요청 객체 (인증 정보 포함)
   */
  public async handleRealtimeConnection(
    ws: WebSocket,
    req: Request,
  ): Promise<void> {
    try {
      // 인증된 사용자 정보 가져오기 (이미 인증된 상태)
      const userId = req.user?.userId;
      const plantId = (req as any).plantId;

      if (!userId || !plantId) {
        console.error('❌ 인증 정보가 없습니다');
        return;
      }

      console.log(`🎙️ 실시간 음성 대화 시작: userId=${userId}, plantId=${plantId}`);

      // Realtime API 연결 생성
      await this.realtimeSpeechService.createRealtimeConnection(userId, plantId, ws);
    } catch (error) {
      console.error('❌ Realtime 연결 처리 중 오류:', error);

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'error',
            error: {
              message: error instanceof Error ? error.message : '서버 오류가 발생했습니다.',
              code: 'server_error',
            },
          }),
        );
        ws.close();
      }
    }
  }
}
