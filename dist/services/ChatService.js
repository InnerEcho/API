import { UserType } from "../interface/chatbot.js";
import db from "../models/index.js";
const {
  ChatHistory,
  User
} = db;
export class ChatService {
  constructor(chatBot) {
    this.chatBot = chatBot;
  }
  async create(userId, plantId, message, emotion) {
    try {
      // 감정 상태가 전달된 경우 사용자 상태 업데이트
      if (emotion) {
        await User.update({
          state: emotion
        }, {
          where: {
            user_id: userId
          }
        });
        console.log(`사용자 ${userId}의 현재 감정이 ${emotion}으로 업데이트되었습니다.`);
      }

      // 기존 챗봇 응답 생성 로직
      const reply = await this.chatBot.processChat(userId, plantId, message);

      // 7. 챗봇 응답 메시지 생성
      const botMessage = {
        user_id: userId,
        plant_id: plantId,
        message: reply.toString(),
        user_type: UserType.BOT,
        send_date: new Date()
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