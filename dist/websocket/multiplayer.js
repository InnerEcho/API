// src/websocket/multiplayer.ts

import { WebSocketServer } from "ws";
import { URL } from "url";
import { MultiplayerTicketService } from "../services/multiplayer/MultiplayerTicketService.js";
import { RoomManager } from "../services/multiplayer/RoomManager.js";

/** Prevent double-initialization across hot-reloads */
let initialized = false;

/* ----------------------------- Origin helpers ----------------------------- */

const isNullishOrigin = v => {
  const s = (v ?? "").trim().toLowerCase();
  // iOS RN often sends "null", some hybrid shells use file://, capacitor://, ionic://
  return !s || s === "null" || s === "undefined" || s === "file://" || s === "capacitor://" || s === "ionic://";
};

/** Normalize to "scheme://host" (lowercase). If invalid → "" */
const normalizeOriginValue = value => {
  if (isNullishOrigin(value)) return "";
  const trimmed = value.trim();
  try {
    const url = /^[a-zA-Z]+:\/\//.test(trimmed) ? new URL(trimmed) : new URL(`http://${trimmed}`);
    return `${url.protocol}//${url.host}`.toLowerCase();
  } catch {
    return "";
  }
};

/** Extract only hostname (lowercase). If invalid → null */
const extractHost = value => {
  if (isNullishOrigin(value)) return null;
  const trimmed = value.trim();
  try {
    const url = /^[a-zA-Z]+:\/\//.test(trimmed) ? new URL(trimmed) : new URL(`http://${trimmed}`);
    return url.hostname.toLowerCase(); // strip port
  } catch {
    return null;
  }
};

/* --------------------------------- Setup --------------------------------- */

export function setupMultiplayerARWebSocket(server) {
  if (initialized) {
    console.log("[WS] Multiplayer already initialized");
    return;
  }
  initialized = true;
  const wss = new WebSocketServer({
    noServer: true,
    clientTracking: true,
    perMessageDeflate: false,
    maxPayload: 32 * 1024 // a little headroom for future payloads
  });
  const ticketService = new MultiplayerTicketService();
  const roomManager = new RoomManager();

  // Comma-separated list. Examples:
  //   WS_ALLOWED_ORIGINS="https://leafy.wolyong.cloud,http://leafy.wolyong.cloud,*"
  const allowedOriginConfig = process.env.WS_ALLOWED_ORIGINS ?? "https://leafy.wolyong.cloud";
  const allowedOriginList = allowedOriginConfig.split(",").map(s => s.trim()).filter(Boolean);
  const normalizedAllowedOrigins = new Set(allowedOriginList.map(normalizeOriginValue).filter(Boolean));
  const allowedHosts = new Set(allowedOriginList.map(extractHost).filter(h => Boolean(h)));
  const allowAnyOrigin = normalizedAllowedOrigins.has("*");
  console.log("[WS] ALLOWED_ORIGINS =", allowedOriginConfig || "(none)");
  console.log("[WS] TICKET_PREFIX", process.env.WS_TICKET_PREFIX ?? "ws:ticket:", "TTL", process.env.WS_TICKET_TTL ?? 30);
  function writeHttpAndDestroy(socket, status, reason) {
    try {
      socket.write(`HTTP/1.1 ${status} ${reason}\r\nX-Reason: ${reason}\r\nConnection: close\r\n\r\n`);
    } catch {}
    try {
      socket.destroy();
    } catch {}
  }
  server.on("upgrade", async (req, socket, head) => {
    try {
      const rawHost = req.headers["x-forwarded-host"] || req.headers.host || "";
      const requestHost = extractHost(rawHost);
      const url = new URL(req.url ?? "", `http://${rawHost || "localhost"}`);

      // 1) Path match
      if (url.pathname !== "/ws/ar-multiplayer") {
        return writeHttpAndDestroy(socket, 404, "PATH_MISMATCH");
      }

      // 2) Origin allow-list (RN iOS may not send Origin → allow nullish)
      const originHeader = String(req.headers.origin || "");
      const normalizedOrigin = normalizeOriginValue(originHeader);
      const originHost = extractHost(originHeader);
      const isAllowedOrigin = isNullishOrigin(originHeader) ||
      // allow RN native
      allowAnyOrigin || normalizedAllowedOrigins.has(normalizedOrigin) || originHost && allowedHosts.has(originHost) ||
      // Same host through proxy: scheme may differ, but host must match
      originHost && requestHost && originHost === requestHost;
      if (!isAllowedOrigin) {
        console.warn("[WS] BAD_ORIGIN", {
          origin: originHeader,
          normalizedOrigin,
          originHost,
          requestHost,
          xfHost: req.headers["x-forwarded-host"],
          xfProto: req.headers["x-forwarded-proto"],
          allowedOrigins: [...normalizedAllowedOrigins],
          allowedHosts: [...allowedHosts]
        });
        return writeHttpAndDestroy(socket, 403, "BAD_ORIGIN");
      }

      // 3) Upgrade header guards
      const up = String(req.headers.upgrade || "");
      const conn = String(req.headers.connection || "");
      if (up.toLowerCase() !== "websocket" || !conn.toLowerCase().includes("upgrade")) {
        console.warn("[WS] BAD_UPGRADE", {
          up,
          conn
        });
        return writeHttpAndDestroy(socket, 400, "BAD_UPGRADE");
      }

      // 4) Ticket check (atomic consume)
      const ticket = url.searchParams.get("ticket") || "";
      if (!ticket) {
        console.warn("[WS] TICKET_MISSING");
        return writeHttpAndDestroy(socket, 400, "TICKET_MISSING");
      }
      const ticketInfo = await ticketService.validateAndConsumeTicket(ticket);
      if (!ticketInfo) {
        console.warn("[WS] TICKET_NOT_FOUND", {
          ticket
        });
        return writeHttpAndDestroy(socket, 401, "TICKET_NOT_FOUND");
      }

      // Attach user info for connection handler
      req.userInfo = ticketInfo;

      // 5) Perform the upgrade
      wss.handleUpgrade(req, socket, head, ws => {
        wss.emit("connection", ws, req);
      });
    } catch (e) {
      console.error("[WS] UPGRADE_ERR", e);
      writeHttpAndDestroy(socket, 500, "INTERNAL_ERROR");
    }
  });

  /* ----------------------------- Heartbeat PING ---------------------------- */
  const HEARTBEAT_INTERVAL = 30_000;
  const aliveMap = new WeakMap();
  const hb = setInterval(() => {
    for (const client of wss.clients) {
      const alive = aliveMap.get(client);
      if (!alive) {
        try {
          client.terminate();
        } catch {}
        aliveMap.delete(client);
        continue;
      }
      aliveMap.set(client, false);
      try {
        client.ping();
      } catch {}
    }
  }, HEARTBEAT_INTERVAL);
  server.on("close", () => clearInterval(hb));

  /* --------------------------- Connection handling ------------------------- */
  wss.on("connection", (ws, req) => {
    const userInfo = req.userInfo;
    if (!userInfo) {
      return ws.close(1011, "Unauthorized");
    }
    aliveMap.set(ws, true);
    ws.on("pong", () => {
      aliveMap.set(ws, true);
    });
    console.log(`[Multiplayer] WS connected: ${userInfo.userName} (${userInfo.userId}) in room ${userInfo.roomId}`);
    const client = {
      ws,
      userId: userInfo.userId,
      userName: userInfo.userName,
      roomId: userInfo.roomId
    };

    // Notify authentication success
    ws.send(JSON.stringify({
      type: "authenticated",
      payload: {
        message: "Authentication successful!",
        userId: client.userId,
        userName: client.userName
      }
    }));

    // Register to room
    roomManager.addUserToRoom(client);

    // Basic message validation
    const MAX_MESSAGE_SIZE = 16 * 1024;
    const isValidMessage = x => x && typeof x === "object" && typeof x.type === "string" && x.type.length <= 32;
    ws.on("message", buf => {
      if (buf.length > MAX_MESSAGE_SIZE) {
        console.warn(`[Multiplayer] Message too large from ${client.userId}`);
        return ws.close(1009, "Message too large");
      }
      let parsed;
      try {
        parsed = JSON.parse(buf.toString());
      } catch {
        return;
      }
      if (!isValidMessage(parsed)) return;
      try {
        roomManager.handleMessage(client.userId, parsed);
      } catch (err) {
        console.error("[Multiplayer] handleMessage error:", err);
      }
    });
    ws.on("close", () => {
      roomManager.removeUserFromRoom(client.userId);
      console.log(`[Multiplayer] Client ${client.userId} disconnected`);
      aliveMap.delete(ws);
    });
    ws.on("error", err => {
      console.error(`[Multiplayer] Error on client ${client.userId}:`, err);
      roomManager.removeUserFromRoom(client.userId);
      aliveMap.delete(ws);
    });
  });
  console.log("🌱 Multiplayer AR WebSocket Server initialized on /ws/ar-multiplayer");
}