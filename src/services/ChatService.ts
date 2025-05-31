import type { IMessage } from '@/interface/chatbot.js';
import { UserType } from '@/interface/chatbot.js';
import { ChatBot } from '@/services/bots/ChatBot.js';
import db from '@/models/index.js';
import axios from 'axios';

const { ChatHistory, User } = db;

interface EmotionResponse {
    success: boolean;
    predictions: number[];
}

// Flask 모델의 감정 레이블과 일치하도록 수정
const EMOTION_LABELS = ["공포", "놀람", "분노", "슬픔", "중립", "행복", "혐오"];

export class ChatService {
  constructor(private chatBot: ChatBot) {}

  async create(userId: number, plantId: number, message: string) {
    try {
      // Flask API를 통한 감정 분류
      let emotionResult: EmotionResponse;
      try {
        const flaskResponse = await axios.post<EmotionResponse>('http://localhost:5000/predict', {
          text: message
        });
        emotionResult = flaskResponse.data;
        console.log('감정 분류 결과:', emotionResult);

        // 감정 분석 결과를 사용자의 state에 저장
        if (emotionResult.success && emotionResult.predictions.length > 0) {
          // 가장 높은 확률의 감정 찾기
          const maxIndex = emotionResult.predictions.indexOf(Math.max(...emotionResult.predictions));
          const dominantEmotion = EMOTION_LABELS[maxIndex];

          // 사용자의 state 업데이트
          await User.update(
            { state: dominantEmotion },
            { where: { user_id: userId } }
          );
          console.log(`사용자 ${userId}의 현재 감정이 ${dominantEmotion}으로 업데이트되었습니다.`);
        }
      } catch (flaskError) {
        console.error('Flask API 호출 중 오류:', flaskError);
        throw new Error('감정 분석 중 오류가 발생했습니다.');
      }

      // 기존 챗봇 응답 생성 로직
      const reply = await this.chatBot.processChat(userId, plantId, message);

    // 7. 챗봇 응답 메시지 생성
    const botMessage: IMessage = {
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