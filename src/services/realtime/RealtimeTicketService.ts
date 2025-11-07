import { randomBytes } from 'crypto';
import redisClient from '@/config/redis.config.js';

/**
 * WebSocket 연결을 위한 일회용 티켓 관리 서비스
 *
 * 보안 강화를 위해 JWT 토큰을 WebSocket으로 직접 전송하지 않고,
 * HTTP API로 먼저 인증한 후 일회용 티켓을 발급받아 사용합니다.
 */
export class RealtimeTicketService {
  private readonly TICKET_PREFIX = 'realtime_ticket:';
  private readonly TICKET_TTL = 30; // 30초 유효 (짧게 설정)

  /**
   * 일회용 티켓 생성
   * @param userId 사용자 ID
   * @param plantId 식물 ID
   * @returns 생성된 티켓 문자열
   */
  async createTicket(userId: number, plantId: number): Promise<string> {
    // 암호학적으로 안전한 랜덤 문자열 생성
    const ticket = randomBytes(32).toString('base64url');
    const key = this.TICKET_PREFIX + ticket;

    // Redis에 티켓 정보 저장 (짧은 TTL)
    await redisClient.setex(
      key,
      this.TICKET_TTL,
      JSON.stringify({
        userId,
        plantId,
        createdAt: Date.now(),
      }),
    );

    console.log(`🎫 티켓 생성: userId=${userId}, plantId=${plantId}, TTL=${this.TICKET_TTL}초`);

    return ticket;
  }

  /**
   * 티켓 검증 및 소비 (일회용)
   * @param ticket 티켓 문자열
   * @returns 티켓에 저장된 사용자 정보 (유효하지 않으면 null)
   */
  async validateAndConsumeTicket(ticket: string): Promise<{
    userId: number;
    plantId: number;
  } | null> {
    const key = this.TICKET_PREFIX + ticket;

    try {
      // 티켓 조회
      const data = await redisClient.get(key);

      if (!data) {
        console.error('❌ 티켓이 존재하지 않거나 만료됨');
        return null;
      }

      // 티켓 정보 파싱
      const ticketInfo = JSON.parse(data);

      // 티켓 즉시 삭제 (일회용)
      await redisClient.del(key);

      console.log(`✅ 티켓 검증 성공 및 소비: userId=${ticketInfo.userId}, plantId=${ticketInfo.plantId}`);

      return {
        userId: ticketInfo.userId,
        plantId: ticketInfo.plantId,
      };
    } catch (error) {
      console.error('❌ 티켓 검증 중 오류:', error);
      return null;
    }
  }

  /**
   * 티켓 삭제 (필요시)
   * @param ticket 삭제할 티켓
   */
  async revokeTicket(ticket: string): Promise<void> {
    const key = this.TICKET_PREFIX + ticket;
    await redisClient.del(key);
    console.log(`🗑️ 티켓 삭제: ${ticket}`);
  }
}
