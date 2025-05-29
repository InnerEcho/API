import type { IMessage } from '../interface/chatbot.js';
export declare class PlantSpeechService {
    /**
     * Google Cloud STT 처리
     */
    speechToText(filePath: string, userId: number, plantId: number): Promise<IMessage>;
    /**
     * Zonos TTS 처리
     */
    textToSpeech(userMessage: string): Promise<Buffer>;
}
