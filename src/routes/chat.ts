import express from 'express';
import { chatBot } from '../controllers/chatbot';

const router = express.Router();

router.post("/chatbot", chatBot);

export default router;