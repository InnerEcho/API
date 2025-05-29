import type { Request, Response } from 'express';
import { ChatService } from '@/services/ChatService.js';
declare class PlantChatBotController {
    private chatService;
    constructor(chatServcie: ChatService);
    /**
     * 🌱 식물 챗봇과의 대화 처리
     */
    chat(req: Request, res: Response): Promise<void>;
}
declare const _default: PlantChatBotController;
export default _default;
