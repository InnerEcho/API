import express from 'express';
import { ChatHistoryController } from '@/controllers/ChatHistoryController.js';
import { ChatHistoryService } from '@/services/ChatHistoryService.js';

const router = express.Router();

// 의존성 주입
const chatHistoryService = new ChatHistoryService();
const chatHistoryController = new ChatHistoryController(chatHistoryService);

router.post(
  '/get',
  chatHistoryController.getChatHistory.bind(chatHistoryController),
);

export default router;
