import { randomBytes } from 'crypto';
import redisClient from "../config/redis.config.js";
export class MultiplayerTicketService {
  TICKET_PREFIX = 'multiplayer_ticket:';
  TICKET_TTL = 30; // 30초 유효

  async createTicket(payload) {
    try {
      const ticket = randomBytes(32).toString('base64url');
      const key = this.TICKET_PREFIX + ticket;
      await redisClient.setex(key, this.TICKET_TTL, JSON.stringify(payload));
      console.log(`🎫 Multiplayer Ticket created for user ${payload.userName} in room ${payload.roomId}`);
      return ticket;
    } catch (error) {
      console.error('[MultiplayerTicketService] Failed to create ticket:', error);
      throw new Error('Ticket creation failed');
    }
  }
  async validateAndConsumeTicket(ticket) {
    try {
      const key = this.TICKET_PREFIX + ticket;
      const data = await redisClient.get(key);
      if (!data) return null;
      await redisClient.del(key); // 티켓 즉시 소비
      return JSON.parse(data);
    } catch (error) {
      console.error('[MultiplayerTicketService] Failed to validate ticket:', error);
      return null;
    }
  }
}