import express from 'express';
import { PlantChatBotController } from '@/controllers/chat/ChatBotController.js';
import { ChatHistoryController } from '@/controllers/chat/ChatHistoryController.js';
import { RealtimeTicketController } from '@/controllers/realtime/RealtimeTicketController.js';
import { RealtimeSpeechController } from '@/controllers/realtime/RealtimeSpeechController.js';
import { ChatService } from '@/services/chat/ChatService.js';
import { ChatBot } from '@/services/bots/ChatBot.js';
import { ReflectionAgent } from '@/services/bots/ReflectionAgent.js';
import { ActionAgent } from '@/services/bots/ActionAgent.js';
import { AgentRouter } from '@/services/chat/AgentRouter.js';
import { DepressionSafetyGuard } from '@/services/chat/DepressionSafetyGuard.js';
import { ChatHistoryService } from '@/services/chat/ChatHistoryService.js';
import { RealtimeTicketService } from '@/services/realtime/RealtimeTicketService.js';
import { RealtimeSpeechService } from '@/services/realtime/RealtimeSpeechService.js';
import { PlantRepository } from '@/services/realtime/PlantRepository.js';
import { PromptBuilder } from '@/services/realtime/PromptBuilder.js';
import { OpenAIRealtimeClient } from '@/services/realtime/OpenAIRealtimeClient.js';
import { verifyTokenV2 } from '@/middlewares/authV2.js';
import { LangchainChatModelFactory } from '@/services/llm/ChatModelFactory.js';
import { OpenAIEmbeddings } from '@langchain/openai';
import { UpstashVectorMemory } from '@/services/memory/UpstashVectorMemory.js';
import { NoopLongTermMemory } from '@/services/memory/LongTermMemory.js';
import { SafetyModerator } from '@/services/chat/SafetyModerator.js';

const router = express.Router();

// 의존성 주입
const chatModelFactory = new LangchainChatModelFactory({
  model: 'gpt-4o',
  temperature: 0.7,
});
const embeddings =
  process.env.OPENAI_API_KEY &&
  new OpenAIEmbeddings({
    apiKey: process.env.OPENAI_API_KEY,
    model: 'text-embedding-3-small',
  });
const longTermMemory =
  (embeddings && UpstashVectorMemory.fromEnv(embeddings)) ||
  new NoopLongTermMemory();
const chatBot = new ChatBot(chatModelFactory);
const reflectionAgent = new ReflectionAgent(chatModelFactory);
const actionAgent = new ActionAgent(chatModelFactory);
const safetyGuard = new DepressionSafetyGuard();
const safetyModerator = new SafetyModerator();
const agentRouter = new AgentRouter({
  default: chatBot,
  reflection: reflectionAgent,
  action: actionAgent,
});
const chatService = new ChatService(
  agentRouter,
  safetyModerator,
  longTermMemory,
);
const plantChatBotController = new PlantChatBotController(chatService);
const chatHistoryService = new ChatHistoryService();
const chatHistoryController = new ChatHistoryController(chatHistoryService);
const realtimeTicketService = new RealtimeTicketService();
const plantRepository = new PlantRepository();
const promptBuilder = new PromptBuilder();
const realtimeSpeechService = new RealtimeSpeechService(
  plantRepository,
  promptBuilder,
  null,
  safetyGuard,
  longTermMemory,
);
const realtimeTicketController = new RealtimeTicketController(realtimeTicketService);
const realtimeSpeechController = new RealtimeSpeechController(realtimeSpeechService);



/**
 * @swagger
 * /chat/plant:
 *   post:
 *     summary: 식물 챗봇과의 상호작용
 *     description: 사용자가 키우는 식물과 대화하는 챗봇 API입니다. 챗봇은 식물의 현재 상태와 이전 대화 이력을 바탕으로 맞춤형 응답을 제공합니다.
 *     tags:
 *       - 식물 챗봇
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_name:
 *                 type: string
 *                 description: 식물 챗봇과 상호작용하는 사용자의 이름
 *                 example: "홍길동"
 *               plant_nickname:
 *                 type: string
 *                 description: 사용자가 지정한 식물의 애칭
 *                 example: "금쪽이"
 *               message:
 *                 type: string
 *                 description: 사용자 입력 메시지 (식물에게 보내는 질문이나 대화 내용)
 *                 example: "오늘은 식물이 어떻게 지내고 있나요?"
 *     responses:
 *       200:
 *         description: 식물 챗봇과의 상호작용이 성공적으로 이루어진 경우
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     user_type:
 *                       type: string
 *                       example: "BOT"
 *                     nick_name:
 *                       type: string
 *                       description: 응답을 제공하는 식물의 애칭
 *                       example: "금쪽이"
 *                     message:
 *                       type: string
 *                       description: 식물 챗봇의 응답 메시지
 *                       example: "저는 오늘 상태가 좋아요! 빛이 조금 강하지만 잘 견디고 있어요."
 *                     send_date:
 *                       type: string
 *                       format: date-time
 *                       description: 챗봇 응답이 생성된 날짜 및 시간
 *                       example: "2024-11-30T12:34:56.789Z"
 *                 msg:
 *                   type: string
 *                   example: "Ok"
 *       404:
 *         description: 해당 식물 데이터를 찾을 수 없는 경우
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 404
 *                 msg:
 *                   type: string
 *                   example: "Not Exists Chatbot DB"
 *       500:
 *         description: 서버 내부 오류가 발생한 경우
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 500
 *                 msg:
 *                   type: string
 *                   example: "ServerError"
 */
router.post(
  '/plant',
  verifyTokenV2,
  plantChatBotController.chat.bind(plantChatBotController)
);

// PlantChatBotController.getChatHistory 호출
router.get(
  '/history/:plantId',
  verifyTokenV2,
  chatHistoryController.getChatHistory.bind(chatHistoryController),
);


router.post(
  '/chat',
  verifyTokenV2,
  plantChatBotController.chat.bind(plantChatBotController)
);

/**
 * @swagger
 * /chat/realtime/session:
 *   post:
 *     summary: WebRTC 세션 생성 및 Ephemeral Token 발급 (권장)
 *     description: |
 *       OpenAI Realtime API WebRTC 방식으로 음성 대화 세션을 생성합니다.
 *       - Opus 코덱 자동 사용 (고품질, 낮은 대역폭)
 *       - 클라이언트가 직접 OpenAI WebRTC endpoint에 연결
 *       - Ephemeral token은 60초 유효
 *       - 서버 부하 감소, 낮은 지연시간
 *     tags:
 *       - Realtime Speech
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - plantId
 *             properties:
 *               plantId:
 *                 type: integer
 *                 description: 대화할 식물 ID
 *                 example: 1
 *     responses:
 *       200:
 *         description: 세션 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "WebRTC session created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     ephemeralToken:
 *                       type: string
 *                       description: OpenAI ephemeral token (60초 유효)
 *                       example: "eph_..."
 *                     expiresAt:
 *                       type: integer
 *                       description: Unix timestamp (초)
 *                       example: 1672531200
 *                     sessionId:
 *                       type: string
 *                       description: 세션 ID
 *                       example: "sess_..."
 *                     expiresIn:
 *                       type: integer
 *                       description: 유효 시간 (초)
 *                       example: 60
 *       401:
 *         description: 인증 실패
 *       400:
 *         description: plantId 누락
 *       500:
 *         description: 서버 오류
 */
router.post(
  '/realtime/session',
  verifyTokenV2,
  realtimeSpeechController.createSession.bind(realtimeSpeechController)
);

/**
 * @swagger
 * /chat/realtime/history:
 *   post:
 *     summary: 대화 히스토리 저장
 *     description: |
 *       WebRTC 세션의 대화 내용을 서버에 저장합니다.
 *       클라이언트가 transcript를 받은 후 이 API를 호출하세요.
 *     tags:
 *       - Realtime Speech
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - plantId
 *             properties:
 *               plantId:
 *                 type: integer
 *                 description: 식물 ID
 *                 example: 1
 *               userMessage:
 *                 type: string
 *                 description: 사용자 메시지
 *                 example: "안녕?"
 *               assistantMessage:
 *                 type: string
 *                 description: AI 응답 메시지
 *                 example: "안녕! 오늘 기분이 어때?"
 *     responses:
 *       200:
 *         description: 저장 성공
 *       401:
 *         description: 인증 실패
 *       400:
 *         description: 필수 파라미터 누락
 *       500:
 *         description: 서버 오류
 */
router.post(
  '/realtime/history',
  verifyTokenV2,
  realtimeSpeechController.saveChatHistory.bind(realtimeSpeechController)
);

/**
 * @swagger
 * /chat/realtime/history/{plantId}:
 *   get:
 *     summary: 대화 히스토리 조회
 *     description: 특정 식물과의 대화 히스토리를 조회합니다.
 *     tags:
 *       - Realtime Speech
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: plantId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 식물 ID
 *         example: 1
 *     responses:
 *       200:
 *         description: 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Ok"
 *                 data:
 *                   type: object
 *                   properties:
 *                     history:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           role:
 *                             type: string
 *                             enum: [user, assistant]
 *                           content:
 *                             type: string
 *       401:
 *         description: 인증 실패
 *       400:
 *         description: 잘못된 plantId
 *       500:
 *         description: 서버 오류
 */
router.get(
  '/realtime/history/:plantId',
  verifyTokenV2,
  realtimeSpeechController.getChatHistory.bind(realtimeSpeechController)
);

/**
 * @swagger
 * /chat/realtime/ticket:
 *   post:
 *     summary: Realtime WebSocket 연결용 일회용 티켓 발급
 *     description: |
 *       WebSocket 연결 전에 HTTP API로 먼저 티켓을 발급받습니다.
 *       - JWT 토큰은 안전한 HTTPS로만 전송
 *       - 티켓은 30초 유효, 일회용
 *       - 발급받은 티켓으로 WebSocket 연결
 *     tags:
 *       - Realtime Speech
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - plantId
 *             properties:
 *               plantId:
 *                 type: integer
 *                 description: 대화할 식물 ID
 *                 example: 1
 *     responses:
 *       200:
 *         description: 티켓 발급 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Ticket created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     ticket:
 *                       type: string
 *                       description: 일회용 티켓 (30초 유효)
 *                       example: "abc123def456..."
 *                     expiresIn:
 *                       type: integer
 *                       description: 티켓 유효 시간 (초)
 *                       example: 30
 *                     wsUrl:
 *                       type: string
 *                       description: WebSocket 연결 URL
 *                       example: "wss://your-server.com/chat/realtime?ticket=abc123..."
 *       401:
 *         description: 인증 실패
 *       400:
 *         description: plantId 누락
 *       500:
 *         description: 서버 오류
 */
router.post(
  '/realtime/ticket',
  verifyTokenV2,
  realtimeTicketController.createTicket.bind(realtimeTicketController)
);

export default router;
