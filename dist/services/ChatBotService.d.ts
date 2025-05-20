import { BaseChatBot } from "./BaseChatBot.js";
import { PlantDbInfo } from "../interface/chatbot.js";
export declare class PlantChatBot extends BaseChatBot {
    protected createPrompt(plantDbInfo: PlantDbInfo, userMessage: string, userId: number, plantId: number): Promise<Array<[string, string]>>;
}
