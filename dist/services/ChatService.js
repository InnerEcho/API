import { UserType } from "../interface/index.js";
import db from "../models/index.js";
export class ChatService {
  constructor(chatBot) {
    this.chatBot = chatBot;
  }
  async create(userId, plantId, message) {
    try {
      // 기존 챗봇 응답 생성 로직
      const reply = await this.chatBot.processChat(userId, plantId, message);

      // 7. 챗봇 응답 메시지 생성
      const botMessage = {
        userId: userId,
        plantId: plantId,
        message: reply.toString(),
        userType: UserType.BOT,
        sendDate: new Date()
      };

      // 8. 사용자 입력 메시지 기록
      const userMessageEntry = {
        user_id: userId,
        plant_id: plantId,
        message: message,
        user_type: UserType.USER,
        send_date: new Date()
      };

      // 9. 대화 이력 DB에 저장
      await db.ChatHistory.bulkCreate([userMessageEntry, botMessage]);

      // 10. 챗봇 응답 반환
      return botMessage;
    } catch (error) {
      console.error('Chat service error:', error);
      throw error;
    }
  }
}