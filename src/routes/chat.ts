import express from 'express';
import { plantChatBot } from '../controllers/chatbot';

const router = express.Router();

/**
 * @swagger
 * /plant:
 *   post:
 *     summary: Communicate with the Plant ChatBot
 *     description: Send a message to the Plant ChatBot and receive a response.
 *     tags:
 *       - Plant ChatBot
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 description: User's message to the chatbot
 *                 example: "How are you?"
 *               nickName:
 *                 type: string
 *                 description: Nickname of the user
 *                 example: "GreenThumb"
 *     responses:
 *       200:
 *         description: Successful response from the chatbot
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   description: Response code
 *                   example: 200
 *                 data:
 *                   type: object
 *                   description: Response data from the chatbot
 *                   properties:
 *                     user_type:
 *                       type: string
 *                       description: Type of user (BOT)
 *                       example: "BOT"
 *                     nick_name:
 *                       type: string
 *                       description: Nickname of the chatbot
 *                       example: "금쪽이"
 *                     message:
 *                       type: string
 *                       description: Chatbot's response
 *                       example: "저는 괜찮아요. 항상 밝은 곳에서 잘 자라고 있어요!"
 *                     send_date:
 *                       type: string
 *                       format: date-time
 *                       description: Date and time of the response
 *                 msg:
 *                   type: string
 *                   description: Result message
 *                   example: "Ok"
 *       400:
 *         description: Bad Request
 *       500:
 *         description: Server Error
 */
router.post("/plant", plantChatBot);

export default router;