import express from 'express';
import PlantChatBotController from '../controllers/chatbot';
import multer from 'multer';

const router = express.Router();

const upload = multer({ dest: 'uploads/' }); // 파일을 임시로 'uploads' 폴더에 저장


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
router.post("/plant", PlantChatBotController.chat);

/**
 * @swagger
 * /stt:
 *   post:
 *     summary: 음성 파일을 텍스트로 변환
 *     description: 사용자가 업로드한 음성 파일을 Google Cloud Speech-to-Text API를 사용하여 텍스트로 변환합니다.
 *     tags:
 *       - 음성 인식
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: 업로드할 음성 파일
 *     responses:
 *       200:
 *         description: 음성 파일이 성공적으로 텍스트로 변환된 경우
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: string
 *                   description: 변환된 텍스트
 *                   example: "안녕하세요, 오늘의 날씨는 맑습니다."
 *                 msg:
 *                   type: string
 *                   example: "Ok"
 *       400:
 *         description: 잘못된 요청 또는 음성 파일이 없는 경우
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 400
 *                 msg:
 *                   type: string
 *                   example: "Not Exist Audio File"
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
 *                   example: "Server Error"
 */
router.post('/stt', upload.single('file'), PlantChatBotController.speechToText);

export default router;