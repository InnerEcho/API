import type { Request, Response } from 'express';
import { MultiplayerTicketService } from '@/services/multiplayer/MultiplayerTicketService.js';

/**
 * AR 멀티플레이어 WebSocket 연결을 위한 티켓 발급 컨트롤러
 */
export class MultiplayerTicketController {
  private ticketService: MultiplayerTicketService;

  constructor() {
    this.ticketService = new MultiplayerTicketService();
  }

  /**
   * WebSocket 연결용 일회용 티켓 발급
   *
   * POST /ar-multiplayer/ticket
   *
   * @param req - roomId를 body에 포함, userId와 userName은 JWT 토큰에서 추출
   * @param res - ticket 반환
   */
  public async createTicket(req: Request, res: Response): Promise<void> {
    try {
      // 인증된 사용자 정보 (JWT 미들웨어에서 추출)
      const userId = req.user?.userId;
      const userName = req.user?.userName;

      if (!userId || !userName) {
        res.status(401).json({
          code: 401,
          msg: 'Authentication required',
        });
        return;
      }

      // 요청 본문에서 roomId 추출
      const { roomId } = req.body;

      if (!roomId) {
        res.status(400).json({
          code: 400,
          msg: 'roomId is required',
        });
        return;
      }

      // 티켓 생성
      const ticket = await this.ticketService.createTicket({
        userId,
        userName,
        roomId,
      });

      // WebSocket URL 생성 (Express 라우터와 충돌 방지를 위해 /ws 경로 사용)
      const protocol = req.secure ? 'wss' : 'ws';
      const host = req.get('host');
      const wsUrl = `${protocol}://${host}/ws/ar-multiplayer?ticket=${ticket}`;

      // 성공 응답
      res.status(200).json({
        code: 200,
        data: {
          ticket,
          expiresIn: 30, // 초 단위
          wsUrl,
        },
        msg: 'Ok',
      });

      console.log(`🎫 AR Multiplayer 티켓 발급: userId=${userId}, userName=${userName}, roomId=${roomId}`);
    } catch (error: any) {
      console.error('❌ AR Multiplayer 티켓 생성 오류:', error);

      res.status(500).json({
        code: 500,
        msg: 'Ticket creation failed',
      });
    }
  }
}