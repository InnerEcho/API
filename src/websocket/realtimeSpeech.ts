import type { Server as HTTPServer } from 'http';
import { WebSocketServer } from 'ws';
import WebSocket from 'ws';
import type { IncomingMessage } from 'http';
import { RealtimeTicketService } from '@/services/realtime/RealtimeTicketService.js';

/**
 * Realtime Speech WebSocket 서버 설정
 * @param server HTTP 서버 인스턴스
 */
export function setupRealtimeSpeechWebSocket(server: HTTPServer): void {
  // WebSocket 서버 생성 (path: /chat/realtime)
  const wss = new WebSocketServer({
    server,
    path: '/chat/realtime',
  });

  const ticketService = new RealtimeTicketService();

  console.log('🎙️ Realtime Speech WebSocket 서버 초기화 완료');

  // WebSocket 연결 이벤트 핸들러
  wss.on('connection', async (ws: WebSocket, req: IncomingMessage) => {
    console.log('🔌 새로운 WebSocket 연결 시도');

    try {
      // URL에서 ticket 쿼리 파라미터 추출
      const url = new URL(req.url!, `http://${req.headers.host}`);
      const ticket = url.searchParams.get('ticket');

      if (!ticket) {
        console.error('❌ 티켓이 제공되지 않음');
        ws.send(
          JSON.stringify({
            type: 'error',
            error: {
              message: '티켓이 필요합니다. POST /chat/realtime/ticket으로 먼저 티켓을 발급받으세요.',
              code: 'missing_ticket',
            },
          }),
        );
        ws.close();
        return;
      }

      // 티켓 검증 및 소비 (일회용)
      const ticketInfo = await ticketService.validateAndConsumeTicket(ticket);

      if (!ticketInfo) {
        console.error('❌ 유효하지 않거나 만료된 티켓');
        ws.send(
          JSON.stringify({
            type: 'error',
            error: {
              message: '유효하지 않거나 만료된 티켓입니다. 새로운 티켓을 발급받으세요.',
              code: 'invalid_ticket',
            },
          }),
        );
        ws.close();
        return;
      }

      console.log(
        `✅ 티켓 인증 성공: userId=${ticketInfo.userId}, plantId=${ticketInfo.plantId}`,
      );

      // req 객체에 사용자 정보 저장
      (req as any).user = { userId: ticketInfo.userId };
      (req as any).plantId = ticketInfo.plantId;

      // 인증 성공 응답
      ws.send(
        JSON.stringify({
          type: 'authenticated',
          message: '인증이 완료되었습니다.',
          userId: ticketInfo.userId,
          plantId: ticketInfo.plantId,
        }),
      );

      console.log(`🎙️ WebSocket 연결 완료: userId=${ticketInfo.userId}`);

      // WebSocket 메시지 핸들러 (필요시 클라이언트 상태 관리)
      ws.on('message', (message: Buffer) => {
        try {
          const data = JSON.parse(message.toString());
          console.log(`📨 Message from user ${ticketInfo.userId}:`, data.type);

          // 필요한 경우 여기서 메시지 처리
          // 예: 상태 업데이트, 모니터링 등
        } catch (error) {
          console.error('❌ 메시지 파싱 실패:', error);
        }
      });

      // 연결 종료 핸들러
      ws.on('close', () => {
        console.log(`🔌 WebSocket 연결 종료: userId=${ticketInfo.userId}`);
      });

      // 에러 핸들러
      ws.on('error', (error) => {
        console.error(`❌ WebSocket 에러 (userId=${ticketInfo.userId}):`, error);
      });
    } catch (error: any) {
      console.error('❌ WebSocket 연결 실패:', error);
      ws.send(
        JSON.stringify({
          type: 'error',
          error: {
            message: '연결 처리 중 오류가 발생했습니다.',
            code: 'connection_error',
          },
        }),
      );
      ws.close();
    }
  });

  // WebSocket 서버 에러 핸들러
  wss.on('error', (error) => {
    console.error('❌ WebSocket 서버 오류:', error);
  });

  // 서버 종료 시 정리
  wss.on('close', () => {
    console.log('🔌 Realtime Speech WebSocket 서버 종료');
  });
}
