import { RealtimeTicketService } from "../../services/realtime/RealtimeTicketService.js";

/**
 * Realtime WebSocket 연결을 위한 티켓 발급 컨트롤러
 */
export class RealtimeTicketController {
  ticketService;
  constructor() {
    this.ticketService = new RealtimeTicketService();
  }

  /**
   * WebSocket 연결용 일회용 티켓 발급
   *
   * POST /chat/realtime/ticket
   *
   * @param req - plantId를 body에 포함, userId는 JWT 토큰에서 추출
   * @param res - ticket 반환
   */
  async createTicket(req, res) {
    try {
      // 인증된 사용자 정보 (JWT 미들웨어에서 추출)
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          code: 401,
          message: '인증이 필요합니다.',
          error: 'UNAUTHORIZED'
        });
        return;
      }

      // 요청 본문에서 plantId 추출
      const {
        plantId
      } = req.body;
      if (!plantId) {
        res.status(400).json({
          code: 400,
          message: 'plantId가 필요합니다.',
          error: 'MISSING_PLANT_ID'
        });
        return;
      }

      // 티켓 생성
      const ticket = await this.ticketService.createTicket(userId, plantId);

      // 성공 응답
      res.status(200).json({
        code: 200,
        message: 'Ticket created successfully',
        data: {
          ticket,
          expiresIn: 30,
          // 초 단위
          wsUrl: `wss://${req.get('host')}/chat/realtime?ticket=${ticket}`
        }
      });
      console.log(`✅ 티켓 발급 완료: userId=${userId}, plantId=${plantId}`);
    } catch (error) {
      console.error('❌ 티켓 생성 중 오류:', error);
      res.status(500).json({
        code: 500,
        message: '티켓 생성 중 오류가 발생했습니다.',
        error: 'SERVER_ERROR'
      });
    }
  }
}