import { UserType } from '../interface/chatbot.js';
import db from '../models/index.js';
export class ChatService {
    constructor(chatBot) {
        this.chatBot = chatBot;
    }
    async create(userId, plantId, userMessage) {
        const reply = await this.chatBot.processChat(userId, plantId, userMessage);
        // 7. 챗봇 응답 메시지 생성
        const botMessage = {
            user_id: userId,
            plant_id: plantId,
            message: reply.toString(),
            user_type: UserType.BOT,
            send_date: new Date(),
        };
        // 8. 사용자 입력 메시지 기록
        const userMessageEntry = {
            user_id: userId,
            plant_id: plantId,
            message: userMessage,
            user_type: UserType.USER,
            send_date: new Date(),
        };
        // 9. 대화 이력 DB에 저장
        await db.ChatHistory.bulkCreate([userMessageEntry, botMessage]);
        // 10. 챗봇 응답 반환
        return botMessage;
    }
}
