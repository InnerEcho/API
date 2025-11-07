import type { Server as HTTPServer, IncomingMessage } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { URL } from 'url';
import { MultiplayerTicketService } from '@/services/multiplayer/MultiplayerTicketService.js';
import { RoomManager } from '@/services/multiplayer/RoomManager.js';

/**
 * 멀티플레이어 AR WebSocket 서버를 설정합니다.
 * @param server - HTTP 서버 인스턴스
 */
export function setupMultiplayerARWebSocket(server: HTTPServer): void {
  // noServer 모드로 WebSocket 서버 생성 (upgrade 이벤트 수동 처리)
  const wss = new WebSocketServer({ noServer: true });

  const ticketService = new MultiplayerTicketService();
  const roomManager = new RoomManager();

  // upgrade 이벤트 핸들러 등록
  server.on('upgrade', (req: IncomingMessage, socket, head) => {
    const pathname = new URL(req.url!, `http://${req.headers.host}`).pathname;

    if (pathname === '/ws/ar-multiplayer') {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
    }
    // 다른 경로는 무시 (다른 WebSocket 서버가 처리하도록)
  });

  // 보안: 최대 메시지 크기 제한 (10KB)
  const MAX_MESSAGE_SIZE = 10 * 1024;
  const HEARTBEAT_INTERVAL = 30000; // 30초

  wss.on('connection', async (ws: WebSocket, req: IncomingMessage) => {
    console.log(`[Multiplayer] New WebSocket connection attempt from ${req.socket.remoteAddress}`);
    console.log(`[Multiplayer] Request URL: ${req.url}`);

    const url = new URL(req.url!, `http://${req.headers.host}`);
    const ticket = url.searchParams.get('ticket');

    if (!ticket) {
      console.log('[Multiplayer] Connection rejected: No ticket provided');
      return ws.close(1008, 'Ticket required.');
    }

    console.log(`[Multiplayer] Validating ticket: ${ticket.substring(0, 10)}...`);

    const userInfo = await ticketService.validateAndConsumeTicket(ticket);
    if (!userInfo) {
      console.log('[Multiplayer] Connection rejected: Invalid or expired ticket');
      return ws.close(1008, 'Invalid ticket.');
    }

    console.log(`[Multiplayer] User authenticated: ${userInfo.userName} (ID: ${userInfo.userId})`);

    const client = {
      ws,
      userId: userInfo.userId, // number 타입으로 유지
      userName: userInfo.userName,
      roomId: userInfo.roomId,
    };

    // Heartbeat 설정 (좀비 연결 감지)
    let isAlive = true;
    ws.on('pong', () => {
      isAlive = true;
    });

    const heartbeatInterval = setInterval(() => {
      if (!isAlive) {
        console.log(`[Multiplayer] Client ${client.userId} connection timeout, terminating...`);
        clearInterval(heartbeatInterval);
        return ws.terminate();
      }
      isAlive = false;
      ws.ping();
    }, HEARTBEAT_INTERVAL);

    // 인증 성공 메시지 먼저 전송 (클라이언트가 자신의 userId와 userName을 알 수 있도록)
    ws.send(JSON.stringify({
        type: 'authenticated',
        payload: {
            message: 'Authentication successful!',
            userId: client.userId,
            userName: client.userName,
        },
    }));

    // RoomManager에 클라이언트 추가 (room-state 메시지가 authenticated 이후에 전송됨)
    roomManager.addUserToRoom(client);

    ws.on('message', (message: Buffer) => {
      // 메시지 크기 제한
      if (message.length > MAX_MESSAGE_SIZE) {
        console.warn(`[Multiplayer] Message from ${client.userId} exceeds size limit`);
        return ws.close(1009, 'Message too large');
      }

      try {
        const parsedMessage = JSON.parse(message.toString());
        roomManager.handleMessage(client.userId, parsedMessage);
      } catch (error) {
        console.error('[Multiplayer] Failed to parse message or handle it:', error);
      }
    });

    ws.on('close', () => {
      clearInterval(heartbeatInterval);
      roomManager.removeUserFromRoom(client.userId);
      console.log(`[Multiplayer] Client ${client.userId} disconnected`);
    });

    ws.on('error', (error) => {
      console.error(`[Multiplayer] Error on client ${client.userId}:`, error);
      clearInterval(heartbeatInterval);
      roomManager.removeUserFromRoom(client.userId);
    });
  });

  console.log('🌱 Multiplayer AR WebSocket Server initialized on /ws/ar-multiplayer');
}
