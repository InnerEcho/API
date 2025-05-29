import { BaseChatBot } from '@/services/bots/BaseChatBot.js';
import type { PlantDbInfo } from '@/interface/chatbot.js';
export declare class GrowthDiaryBot extends BaseChatBot {
    private chatHistoryService;
    constructor();
    createPrompt(plantDbInfo: PlantDbInfo, userId: number, plantId: number, userMessage: string): Promise<Array<[string, string]>>;
}
