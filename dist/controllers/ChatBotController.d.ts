import { Request, Response } from 'express';
declare class PlantChatBotController {
    /**
     * 🌱 식물 챗봇과의 대화 처리
     */
    chat(req: Request, res: Response): Promise<void>;
    /**
     * 🌱 채팅 기록 조회
     */
    getChatHistory(req: Request, res: Response): Promise<void>;
}
declare const _default: PlantChatBotController;
export default _default;
