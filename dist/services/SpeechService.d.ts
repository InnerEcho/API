import { IMessage } from "../interface/chatbot.js";
declare class PlantSpeechService {
    /**
     * Google Cloud STT 처리
     */
    speechToText(filePath: string, userId: number, plantId: number): Promise<IMessage>;
    /**
     * Zonos TTS 처리
     */
    textToSpeech(userMessage: string): Promise<Buffer>;
}
declare const _default: PlantSpeechService;
export default _default;
