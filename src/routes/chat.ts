import express from 'express';
import { plantChatBot } from '../controllers/chatbot';

const router = express.Router();

router.post("/plant", plantChatBot);

export default router;