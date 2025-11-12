import type { Server as HTTPServer, IncomingMessage } from 'http';
import type { Duplex } from 'stream';
import { WebSocketServer, WebSocket } from 'ws';
import { URL } from 'url';
import { MultiplayerTicketService } from '@/services/multiplayer/MultiplayerTicketService.js';
import { RoomManager } from '@/services/multiplayer/RoomManager.js';

let initialized = false;

export function setupMultiplayerARWebSocket(server: HTTPServer): void {
  if (initialized) { console.log('[WS] already initialized'); return; }
  initialized = true;

  const wss = new WebSocketServer({
    noServer: true,
    clientTracking: true,
    perMessageDeflate: false,
    maxPayload: 16 * 1024,
  });

  const ticketService = new MultiplayerTicketService();
  const roomManager = new RoomManager();

  console.log('[WS] ALLOWED_ORIGINS', process.env.WS_ALLOWED_ORIGINS ?? 'https://leafy.wolyong.cloud');
  console.log('[WS] TICKET_PREFIX', process.env.WS_TICKET_PREFIX ?? 'ws:ticket:', 'TTL', process.env.WS_TICKET_TTL ?? 30);

  function writeHttpAndDestroy(socket: Duplex, status: number, reason: string) {
    try {
      socket.write(`HTTP/1.1 ${status} ${reason}\r\nX-Reason: ${reason}\r\nConnection: close\r\n\r\n`);
    } catch {}
    try { socket.destroy(); } catch {}
  }

  server.on('upgrade', async (req: IncomingMessage, socket: Duplex, head: Buffer) => {
    try {
      const url = new URL(req.url ?? '', `http://${req.headers.host}`);

      // 1) 정확 경로 매칭
      if (url.pathname !== '/ws/ar-multiplayer') {
        return writeHttpAndDestroy(socket, 404, 'PATH_MISMATCH');
      }

      // 2) Origin 화이트리스트 — RN은 Origin이 비어있을 수 있으므로 "빈 값은 통과"
      const allowed = (process.env.WS_ALLOWED_ORIGINS ?? 'https://leafy.wolyong.cloud')
        .split(',').map(s => s.trim()).filter(Boolean);
      const origin = String((req.headers as any).origin || '');
      if (origin && !allowed.includes(origin)) {
        console.warn('[WS] BAD_ORIGIN', { origin });
        return writeHttpAndDestroy(socket, 403, 'BAD_ORIGIN');
      }

      // 3) 업그레이드 헤더 검증
      const up = String((req.headers as any).upgrade || '');
      const conn = String((req.headers as any).connection || '');
      if (up.toLowerCase() !== 'websocket' || !conn.toLowerCase().includes('upgrade')) {
        console.warn('[WS] BAD_UPGRADE', { up, conn });
        return writeHttpAndDestroy(socket, 400, 'BAD_UPGRADE');
      }

      // 4) 티켓 검증 + 원자적 소비
      const ticket = url.searchParams.get('ticket') || '';
      if (!ticket) {
        console.warn('[WS] TICKET_MISSING');
        return writeHttpAndDestroy(socket, 400, 'TICKET_MISSING');
      }

      const ticketInfo = await ticketService.validateAndConsumeTicket(ticket);
      if (!ticketInfo) {
        console.warn('[WS] TICKET_NOT_FOUND', { ticket });
        return writeHttpAndDestroy(socket, 401, 'TICKET_NOT_FOUND');
      }

      (req as any).userInfo = ticketInfo;

      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
    } catch (e) {
      console.error('[WS] UPGRADE_ERR', e);
      writeHttpAndDestroy(socket, 500, 'INTERNAL_ERROR');
    }
  });

  // ---- 전역 Heartbeat (운영 안정) ----
  const HEARTBEAT_INTERVAL = 30_000;
  const aliveMap: WeakMap<WebSocket, boolean> = new WeakMap();

  const hb = setInterval(() => {
    for (const client of wss.clients) {
      const alive = aliveMap.get(client);
      if (!alive) {
        try { client.terminate(); } catch {}
        aliveMap.delete(client);
        continue;
      }
      aliveMap.set(client, false);
      try { client.ping(); } catch {}
    }
  }, HEARTBEAT_INTERVAL);

  server.on('close', () => clearInterval(hb));

  // ---- 커넥션 핸들러 ----
  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    const userInfo = (req as any).userInfo as
      | { userId: number; userName: string; roomId: string }
      | undefined;

    if (!userInfo) {
      return ws.close(1011, 'Unauthorized');
    }

    aliveMap.set(ws, true);
    ws.on('pong', () => { aliveMap.set(ws, true); });

    console.log(`[Multiplayer] WS connected: ${userInfo.userName} (${userInfo.userId}) in room ${userInfo.roomId}`);

    const client = {
      ws,
      userId: userInfo.userId, // number 타입으로 유지
      userName: userInfo.userName,
      roomId: userInfo.roomId,
    };

    // 인증 성공 통지
    ws.send(JSON.stringify({
        type: 'authenticated',
        payload: {
            message: 'Authentication successful!',
            userId: client.userId,
            userName: client.userName,
        },
    }));

    // 룸 등록
    roomManager.addUserToRoom(client);

    // 메시지 검증(간단)
    const MAX_MESSAGE_SIZE = 10 * 1024;
    const isValidMessage = (x: any): x is { type: string; payload?: any } =>
      x && typeof x === 'object' && typeof x.type === 'string' && x.type.length <= 32;

    ws.on('message', (buf: Buffer) => {
      if (buf.length > MAX_MESSAGE_SIZE) {
        console.warn(`[Multiplayer] Message too large from ${client.userId}`);
        return ws.close(1009, 'Message too large');
      }
      let parsed: any;
      try { parsed = JSON.parse(buf.toString()); } catch { return; }
      if (!isValidMessage(parsed)) return;
      try { roomManager.handleMessage(client.userId, parsed); }
      catch (err) { console.error('[Multiplayer] handleMessage error:', err); }
    });

    ws.on('close', () => {
      roomManager.removeUserFromRoom(client.userId);
      console.log(`[Multiplayer] Client ${client.userId} disconnected`);
      aliveMap.delete(ws);
    });

    ws.on('error', (err) => {
      console.error(`[Multiplayer] Error on client ${client.userId}:`, err);
      roomManager.removeUserFromRoom(client.userId);
      aliveMap.delete(ws);
    });
  });

  console.log('🌱 Multiplayer AR WebSocket Server initialized on /ws/ar-multiplayer');
}