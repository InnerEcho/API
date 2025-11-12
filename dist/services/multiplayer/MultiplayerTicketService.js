import { randomBytes } from 'crypto';
import redisClient from "../../config/redis.config.js";
export class MultiplayerTicketService {
  // ❗ .env 없으면 기본값 사용 → .env 안 바꿔도 동작
  TICKET_PREFIX = process.env.WS_TICKET_PREFIX || 'ws:ticket:';
  TICKET_TTL = Number(process.env.WS_TICKET_TTL || 30); // sec

  /** 티켓 발급 (REST에서 사용) */
  async createTicket(payload) {
    const ticket = randomBytes(32).toString('base64url');
    const key = this.TICKET_PREFIX + ticket;
    const withExp = {
      ...payload,
      exp: Date.now() + this.TICKET_TTL * 1000
    };

    // ioredis면 setex, node-redis v4면 setEx인데
    // 프로젝트의 redisClient 구현에 맞춰 (any)로 호출
    await redisClient.setex(key, this.TICKET_TTL, JSON.stringify(withExp));
    console.log(`[TICKET] SET ${key} ttl=${this.TICKET_TTL}s user=${payload.userName} room=${payload.roomId}`);
    return ticket;
  }

  /** 검증 + 1회성 소비 (WS 업그레이드에서 사용) */
  async validateAndConsumeTicket(ticket) {
    const key = this.TICKET_PREFIX + ticket;
    let json = null;
    try {
      if (typeof redisClient.getdel === 'function') {
        // Redis 6.2+: GETDEL
        json = await redisClient.getdel(key);
      } else {
        // Lua로 GET+DEL 원자화
        const lua = `
          local v = redis.call('GET', KEYS[1])
          if v then redis.call('DEL', KEYS[1]) end
          return v
        `;
        json = await redisClient.eval(lua, 1, key);
      }
    } catch (e) {
      console.error('[TICKET] GETDEL error', e);
      return null;
    }
    if (!json) {
      console.warn('[TICKET] NOT_FOUND', {
        key
      });
      return null;
    }
    const data = JSON.parse(json);
    if (data.exp && Date.now() > data.exp + 2000) {
      console.warn('[TICKET] EXPIRED', {
        key,
        exp: data.exp,
        now: Date.now()
      });
      return null;
    }
    console.log(`[TICKET] CONSUMED ${key} user=${data.userName} room=${data.roomId}`);
    return data;
  }
}