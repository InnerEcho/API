import type { IMessage } from '@/interface/chatbot.js';
import { UserType } from '@/interface/chatbot.js';
import { ChatBot } from '@/services/bots/ChatBot.js';
import db from '@/models/index.js';

const { ChatHistory, User } = db;

export class ChatService {
  constructor(private chatBot: ChatBot) {}

  async create(user_id: number, plant_id: number, message: string, emotion?: string) {
    try {
      // 감정 상태가 전달된 경우 사용자 상태 업데이트
      if (emotion) {
        await User.update(
          { state: emotion },
          { where: { user_id: user_id } }
        );
        console.log(`사용자 ${user_id}의 현재 감정이 ${emotion}으로 업데이트되었습니다.`);
      }

      // 기존 챗봇 응답 생성 로직
      const reply = await this.chatBot.processChat(user_id, plant_id, message);

    // 7. 챗봇 응답 메시지 생성
    const botMessage: IMessage = {
      user_id: user_id,
      plant_id: plant_id,
      message: reply.toString(),
      user_type: UserType.BOT,
      send_date: new Date(),
    };

    // 8. 사용자 입력 메시지 기록
    const userMessageEntry = {
      user_id: user_id,
      plant_id: plant_id,
      message: message,
      user_type: UserType.USER,
      send_date: new Date(),
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