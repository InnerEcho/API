import { IMessage } from '../interface/chatbot.js';
import { ChatBot } from './bots/ChatBot.js';
export declare class ChatService {
    private chatBot;
    constructor(chatBot: ChatBot);
    create(userId: number, plantId: number, userMessage: string): Promise<IMessage>;
}
