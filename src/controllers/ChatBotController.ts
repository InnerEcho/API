import type { Request, Response } from 'express';
import type { ApiResult } from '@/interface/index.js';
import { ChatService } from '@/services/ChatService.js';
import { EmotionService } from '@/services/EmotionService.js';
import db from '@/models/index.js';

const { User } = db;

export class PlantChatBotController {
  private chatService: ChatService;
  private emotionService: EmotionService;

  constructor(chatService: ChatService) {
    this.chatService = chatService;
    this.emotionService = new EmotionService();
  }
  /**
   * 🌱 식물 챗봇과의 대화 처리
   */
  public async chat(req: Request, res: Response): Promise<void> {
    const result: ApiResult = { code: 400, data: null, msg: 'Failed' };

    try {
      //파라미터 값 받기
      const userId = req.user!.userId;

      const { message, plantId } = req.body;
      
      //챗봇 응답 생성
      const response = await this.chatService.create(userId, plantId, message);

      //결과 반환
      result.code = 200;
      result.data = response;
      result.msg = 'Ok';
      res.status(200).json(result);

      //대화 기반 감정 분석(비동기 처리)
      (async () => {
        try {
          const emotion = await this.emotionService.analyze(message);
          console.log(`사용자 ${userId}의 감정 분석 결과: ${emotion}`);
  
          if (emotion) {
            await User.update({ state: emotion }, { where: { user_id: userId } });
       z     console.log(`사용자 ${userId}의 감정 상태가 '${emotion}'으로 DB에 저장됨`);
          } else {
            console.warn(`사용자 ${userId}의 감정 분석 결과가 없어 DB 업데이트를 건너뜀`);
          }
        } catch (err) {
          // 백그라운드 작업에서 에러가 발생하더라도 서버가 중단되지 않도록
          // 에러를 별도로 기록합니다.
          console.error('백그라운드 감정 분석 작업 실패:', err);
        }
      })();


    } catch (err) {
      console.error(err);
      result.code = 500;
      result.msg = 'ServerError';
      res.status(500).json(result);
    }
  }
}
