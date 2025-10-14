import { WebSocketServer } from 'ws';
import { RealtimeSpeechController } from "../controllers/RealtimeSpeechController.js";
import { RealtimeTicketService } from "../services/RealtimeTicketService.js";

/**
 * Realtime Speech WebSocket 서버 설정
 * @param server HTTP 서버 인스턴스
 */
export function setupRealtimeSpeechWebSocket(server) {
  // WebSocket 서버 생성 (path: /chat/realtime)
  const wss = new WebSocketServer({
    server,
    path: '/chat/realtime'
  });
  const realtimeSpeechController = new RealtimeSpeechController();
  const ticketService = new RealtimeTicketService();
  console.log('🎙️ Realtime Speech WebSocket 서버 초기화 완료');

  // WebSocket 연결 이벤트 핸들러
  wss.on('connection', async (ws, req) => {
    console.log('🔌 새로운 WebSocket 연결 시도');
    try {
      // URL에서 ticket 쿼리 파라미터 추출
      const url = new URL(req.url, `http://${req.headers.host}`);
      const ticket = url.searchParams.get('ticket');
      if (!ticket) {
        console.error('❌ 티켓이 제공되지 않음');
        ws.send(JSON.stringify({
          type: 'error',
          error: {
            message: '티켓이 필요합니다. POST /chat/realtime/ticket으로 먼저 티켓을 발급받으세요.',
            code: 'missing_ticket'
          }
        }));
        ws.close();
        return;
      }

      // 티켓 검증 및 소비 (일회용)
      const ticketInfo = await ticketService.validateAndConsumeTicket(ticket);
      if (!ticketInfo) {
        console.error('❌ 유효하지 않거나 만료된 티켓');
        ws.send(JSON.stringify({
          type: 'error',
          error: {
            message: '유효하지 않거나 만료된 티켓입니다. 새로운 티켓을 발급받으세요.',
            code: 'invalid_ticket'
          }
        }));
        ws.close();
        return;
      }
      console.log(`✅ 티켓 인증 성공: userId=${ticketInfo.userId}, plantId=${ticketInfo.plantId}`);

      // req 객체에 사용자 정보 저장
      req.user = {
        userId: ticketInfo.userId
      };
      req.plantId = ticketInfo.plantId;

      // 인증 성공 응답
      ws.send(JSON.stringify({
        type: 'authenticated',
        message: '인증이 완료되었습니다.'
      }));

      // Realtime API 연결 시작
      await realtimeSpeechController.handleRealtimeConnection(ws, req);
    } catch (error) {
      console.error('❌ WebSocket 연결 실패:', error);
      ws.send(JSON.stringify({
        type: 'error',
        error: {
          message: '연결 처리 중 오류가 발생했습니다.',
          code: 'connection_error'
        }
      }));
      ws.close();
    }
  });

  // WebSocket 서버 에러 핸들러
  wss.on('error', error => {
    console.error('❌ WebSocket 서버 오류:', error);
  });

  // 서버 종료 시 정리
  wss.on('close', () => {
    console.log('🔌 Realtime Speech WebSocket 서버 종료');
  });
}