import { EmotionService } from "../services/EmotionService.js";
import db from "../models/index.js";
const {
  User
} = db;
export class PlantChatBotController {
  constructor(chatService) {
    this.chatService = chatService;
    this.emotionService = new EmotionService();
  }
  /**
   * 🌱 식물 챗봇과의 대화 처리
   */
  async chat(req, res) {
    const result = {
      code: 400,
      data: null,
      msg: 'Failed'
    };
    try {
      const {
        message,
        user_id,
        plant_id
      } = req.body;
      const response = await this.chatService.create(user_id, plant_id, message);

      // 1️⃣ 감정 분석 수행
      const emotion = await this.emotionService.analyze(message);
      console.log(`사용자 ${user_id}의 감정 분석 결과: ${emotion}`);

      // 2️⃣ 감정 상태를 User 테이블에 업데이트
      if (emotion) {
        await User.update({
          state: emotion
        }, {
          where: {
            user_id
          }
        });
        console.log(`사용자 ${user_id}의 감정 상태가 '${emotion}'으로 DB에 저장됨`);
      } else {
        console.warn(`사용자 ${user_id}의 감정 분석 결과가 없어 DB 업데이트를 건너뜀`);
      }
      result.code = 200;
      result.data = response;
      result.msg = 'Ok';
      res.status(200).json(result);
    } catch (err) {
      console.error(err);
      result.code = 500;
      result.msg = 'ServerError';
      res.status(500).json(result);
    }
  }
}