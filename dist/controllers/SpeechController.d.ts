import { Request, Response } from "express";
declare class PlantSpeechController {
    /**
     * STT 처리
     */
    speechToText(req: Request, res: Response): Promise<void>;
    /**
     * TTS 처리
     */
    textToSpeech(req: Request, res: Response): Promise<void>;
}
declare const _default: PlantSpeechController;
export default _default;
