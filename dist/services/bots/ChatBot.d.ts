import { BaseChatBot } from './BaseChatBot.js';
import { PlantDbInfo } from '../../interface/chatbot.js';
export declare class ChatBot extends BaseChatBot {
    createPrompt(plantDbInfo: PlantDbInfo, userId: number, plantId: number, userMessage: string): Promise<Array<[string, string]>>;
}
