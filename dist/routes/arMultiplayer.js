import express from 'express';
import { MultiplayerTicketController } from "../controllers/multiplayer/MultiplayerTicketController.js";
import { verifyTokenV2 } from "../middlewares/authV2.js";
const router = express.Router();

// 의존성 주입
const multiplayerTicketController = new MultiplayerTicketController();

/**
 * POST /ar-multiplayer/ticket
 * AR 멀티플레이어 WebSocket 연결용 일회용 티켓 발급
 */
router.post('/ticket', verifyTokenV2, multiplayerTicketController.createTicket.bind(multiplayerTicketController));
export default router;