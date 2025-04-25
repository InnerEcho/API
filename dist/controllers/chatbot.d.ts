import { Request, Response } from "express";
declare class PlantChatBotController {
    /**
     * 🌱 식물 챗봇과의 대화 처리
     */
    chat(req: Request, res: Response): Promise<void>;
    speechToText(req: Request, res: Response): Promise<any>;
    textToSpeech(req: Request, res: Response): Promise<void>;
    getChatHistory(req: Request, res: Response): Promise<void>;
}
declare const _default: PlantChatBotController;
export default _default;
