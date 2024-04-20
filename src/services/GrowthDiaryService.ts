import { IMessage, UserType } from '../interface/chatbot.js';
import { GrowthDiaryBot } from './bots/GrowthDiaryBot.js';
import db from '../models/index.js';

export class GrowthDiaryService {
  constructor(private growthDiaryBot: GrowthDiaryBot) {}

  async create(userId: number, plantId: number, userMessage: string) {
    // 1. 챗봇 응답 생성
    const reply = await this.growthDiaryBot.processChat(userId, plantId, userMessage);

    // 2. DB 저장용 메시지 객체 생성
    const now = new Date();

    
    // 2. 성장일지 title 및 content 정의
    const title = `${now.toISOString().split('T')[0]} 일지`; // 예: "2025-05-20 일지"
    const content = reply.toString();

    // 3. 성장일지 DB 저장
    const createdDiary = await db.GrowthDiary.create({
      user_id: userId,
      title,
      content,
      image_url: null,
      created_at: now,
      updated_at: now,
      is_deleted: false,
      edited: false,
    });

    // 4. 결과 반환
    return createdDiary;
  }

}
