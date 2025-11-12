import { UserType } from "../../interface/index.js";
export class ChatService {
  constructor(chatBot) {
    this.chatBot = chatBot;
  }
  async create(userId, plantId, message) {
    try {
      // RunnableWithMessageHistory가 자동으로 히스토리를 관리하므로
      // 챗봇 응답만 생성하면 됩니다
      const reply = await this.chatBot.processChat(userId, plantId, message);

      // 응답용 메시지 객체 생성
      const botMessage = {
        userId: userId,
        plantId: plantId,
        message: reply.toString(),
        sendDate: new Date(),
        userType: UserType.BOT
      };
      return botMessage;
    } catch (error) {
      console.error('Chat service error:', error);
      throw error;
    }
  }
}