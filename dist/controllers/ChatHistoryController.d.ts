import type { Request, Response } from 'express';
import { ChatHistoryService } from '../services/ChatHistoryService.js';
declare class ChatHistoryController {
    private chatHistoryService;
    constructor(chatHistoryService: ChatHistoryService);
    /**
     * 🌱 채팅 기록 조회
     */
    getChatHistory(req: Request, res: Response): Promise<void>;
}
declare const _default: ChatHistoryController;
export default _default;
