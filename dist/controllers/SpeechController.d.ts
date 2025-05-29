import type { Request, Response } from 'express';
import { PlantSpeechService } from '../services/SpeechService.js';
declare class PlantSpeechController {
    private plantSpeechService;
    constructor(plantSpeechService: PlantSpeechService);
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
