// src/ws/setupMultiplayerARWebSocket.ts
import type { Server as HTTPServer, IncomingMessage } from 'http';
import type { Socket } from 'net';
import { WebSocketServer, WebSocket } from 'ws';
import { URL } from 'url';
import { MultiplayerTicketService } from '@/services/multiplayer/MultiplayerTicketService.js';
import { RoomManager } from '@/services/multiplayer/RoomManager.js';

/**
 * 멀티플레이어 AR WebSocket 서버를 설정합니다.
 * - 경로: /ws/ar-multiplayer
 * - 업그레이드 전에 ticket 검증 (만료/사용됨/없음 등) 후에만 101 업그레이드
 * - Nginx 프록시 뒤에서 동작 가정 (Host/X-Forwarded-* 제공)
 */
export function setupMultiplayerARWebSocket(server: HTTPServer): void {
  // noServer 모드: upgrade를 직접 가로채서 검증 후 업그레이드
  const wss = new WebSocketServer({ noServer: true });

  const ticketService = new MultiplayerTicketService();
  const roomManager = new RoomManager();

  function writeHttpAndDestroy(socket: Socket, status: number, reason: string) {
    try {
      socket.write(`HTTP/1.1 ${status} ${reason}\r\nConnection: close\r\n\r\n`);
    } catch {}
    try { socket.destroy(); } catch {}
  }

server.on('upgrade', (req, socket, head) => {
  try {
    const url = new URL(req.url ?? '', `http://${req.headers.host}`);
    const ticket = url.searchParams.get('ticket') || '';
    const up = (req.headers.upgrade || '').toString();
    const conn = (req.headers.connection || '').toString();

    // 1) 업그레이드 1차 체크
    if (up.toLowerCase() !== 'websocket' || !conn.toLowerCase().includes('upgrade')) {
      console.warn('[WS] BAD_UPGRADE', { up, conn });
      socket.write('HTTP/1.1 400 Bad Request\r\nX-Reason: BAD_UPGRADE\r\n\r\n');
      socket.destroy(); return;
    }

    // 2) 티켓 로드 (Redis/메모리 무엇이든)
    const info = /* loadTicket(ticket) */ null; // <-- 실제 함수
    if (!ticket) {
      console.warn('[WS] TICKET_MISSING');
      socket.write('HTTP/1.1 400 Bad Request\r\nX-Reason: TICKET_MISSING\r\n\r\n');
      socket.destroy(); return;
    }
    if (!info) {
      console.warn('[WS] TICKET_NOT_FOUND', { ticket });
      socket.write('HTTP/1.1 401 Unauthorized\r\nX-Reason: TICKET_NOT_FOUND\r\n\r\n');
      socket.destroy(); return;
    }
    if (info.used) {
      console.warn('[WS] TICKET_USED', { ticket });
      socket.write('HTTP/1.1 401 Unauthorized\r\nX-Reason: TICKET_USED\r\n\r\n');
      socket.destroy(); return;
    }
    if (Date.now() > info.exp + 2000) {
      console.warn('[WS] TICKET_EXPIRED', { ticket, exp: info.exp, now: Date.now() });
      socket.write('HTTP/1.1 401 Unauthorized\r\nX-Reason: TICKET_EXPIRED\r\n\r\n');
      socket.destroy(); return;
    }

    // 3) 통과 → 여기서 used=true로 마킹하고 handleUpgrade
    // markUsed(ticket)
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req /*, user */);
    });
  } catch (e) {
    console.error('[WS] UPGRADE_ERR', e);
    try { socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n'); } catch {}
    socket.destroy();
  }
});



  // --- 보안/헬스 설정 ---
  const MAX_MESSAGE_SIZE = 10 * 1024; // 10KB
  const HEARTBEAT_INTERVAL = 30_000;  // 30초

  // --- 커넥션 핸들러 (이미 인증됨) ---
  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    const userInfo = (req as any).userInfo as
      | { userId: number; userName: string; roomId: string }
      | undefined;

    if (!userInfo) {
      // 이론상 도달하지 않음(업그레이드 전에 검증됨)
      return ws.close(1011, 'Unauthorized');
    }

    console.log(
      `[Multiplayer] WS connected: ${userInfo.userName} (${userInfo.userId}) in room ${userInfo.roomId}`
    );

    const client = {
      ws,
      userId: userInfo.userId,
      userName: userInfo.userName,
      roomId: userInfo.roomId,
    };

    // Heartbeat(좀비 커넥션 정리)
    let isAlive = true;
    ws.on('pong', () => { isAlive = true; });

    const heartbeatInterval = setInterval(() => {
      if (!isAlive) {
        console.log(`[Multiplayer] Client ${client.userId} timeout, terminating...`);
        clearInterval(heartbeatInterval);
        return ws.terminate();
      }
      isAlive = false;
      try { ws.ping(); } catch {}
    }, HEARTBEAT_INTERVAL);

    // 인증 성공 통지 (클라이언트가 본인 식별자 획득)
    ws.send(JSON.stringify({
      type: 'authenticated',
      payload: {
        message: 'Authentication successful!',
        userId: client.userId,
        userName: client.userName,
      },
    }));

    // 룸 매니저 등록 → 기존 로직 활용
    roomManager.addUserToRoom(client);

    // 메시지 핸들링
    ws.on('message', (data: Buffer) => {
      if (data.length > MAX_MESSAGE_SIZE) {
        console.warn(`[Multiplayer] Message too large from ${client.userId}`);
        return ws.close(1009, 'Message too large');
      }
      try {
        const parsed = JSON.parse(data.toString());
        roomManager.handleMessage(client.userId, parsed);
      } catch (err) {
        console.error('[Multiplayer] JSON parse/handle error:', err);
      }
    });

    ws.on('close', () => {
      clearInterval(heartbeatInterval);
      roomManager.removeUserFromRoom(client.userId);
      console.log(`[Multiplayer] Client ${client.userId} disconnected`);
    });

    ws.on('error', (err) => {
      console.error(`[Multiplayer] Error on client ${client.userId}:`, err);
      clearInterval(heartbeatInterval);
      roomManager.removeUserFromRoom(client.userId);
    });
  });

  console.log('🌱 Multiplayer AR WebSocket Server initialized on /ws/ar-multiplayer');
}
