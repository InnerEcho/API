import { ChatService } from "../services/ChatService.js";
import { ChatBot } from "../services/bots/ChatBot.js";
import { AnalysisService } from "../services/AnalysisService.js";
import db from "../models/index.js";
const {
  User
} = db;
export class MissionController {
  missionService;
  analysisService;
  constructor(missionService) {
    this.missionService = missionService;
    this.analysisService = new AnalysisService();
  }
  async getMissions(req, res) {
    const result = {
      code: 400,
      data: null,
      msg: 'Failed'
    };
    try {
      const userId = req.user.userId;
      const response = await this.missionService.getMissions(userId);
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
  async completeMission(req, res) {
    const result = {
      code: 400,
      data: null,
      msg: 'Failed'
    };
    try {
      const userId = req.user.userId;
      const {
        missionId
      } = req.body;
      const response = await this.missionService.completeMission(userId, missionId);
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
  async drinkWater(req, res) {
    const apiResult = {
      code: 400,
      data: null,
      msg: ''
    };
    try {
      const userId = req.user.userId;
      const {
        missionId
      } = req.body;
      // 미션 id가 없을 때
      if (!missionId) {
        apiResult.msg = 'Missing required fields: missionId';
        res.status(400).json(apiResult);
        return;
      }
      // 실제로 이미지가 전송되지 않을 때(추후 이미지가 전송되는 multer 작성해야함)
      if (!req.file) {
        apiResult.msg = 'Image file is required';
        res.status(400).json(apiResult);
        return;
      }
      const missionIdNum = parseInt(missionId);

      // 변환된 값이 NaN인지 확인
      if (isNaN(missionIdNum)) {
        apiResult.msg = '유효하지 않은 missionId 입니다.';
        res.status(400).json(apiResult);
        return;
      }
      // 이미지가 정상적으로 전송되었으면 미션 완료 처리
      const response = await this.missionService.completeMission(userId, missionIdNum);
      apiResult.code = 200;
      apiResult.data = response;
      apiResult.msg = 'Mission completed successfully';
      res.status(200).json(apiResult);
    } catch (err) {
      console.error('오류 발생:', err); // 에러 로그 추가
      apiResult.code = 500;
      apiResult.msg = 'ServerError';
      res.status(500).json(apiResult);
    }
  }
  async chatWithPlant(req, res) {
    const apiResult = {
      code: 400,
      data: null,
      msg: ''
    };
    try {
      const userId = req.user.userId;
      const {
        missionId,
        plantId,
        message
      } = req.body;

      // 필수 필드 검증
      if (!missionId || !plantId || !message) {
        apiResult.msg = 'Missing required fields: missionId, plantId, message';
        res.status(400).json(apiResult);
        return;
      }

      // 챗봇과 대화 처리
      const chatService = new ChatService(new ChatBot());
      const chatResponse = await chatService.create(userId, plantId, message); // 미션 수락 후 한번 대화하도록

      // 대화가 성공적으로 이루어졌으면 미션 완료 처리
      if (chatResponse) {
        // 사용자가 미션완료 클릭 시 미션완료 되도록 바꿔야 함
        const response = await this.missionService.completeMission(userId, missionId);
        apiResult.code = 200;
        apiResult.data = {
          chat_response: chatResponse,
          mission_completed: response
        };
        apiResult.msg = 'Chat completed and mission finished successfully';
        res.status(200).json(apiResult);
      }
    } catch (err) {
      console.error('오류 발생:', err);
      apiResult.code = 500;
      apiResult.msg = 'ServerError';
      res.status(500).json(apiResult);
    }
  }
  async completeStretching(req, res) {
    const apiResult = {
      code: 400,
      data: null,
      msg: ''
    };
    try {
      const userId = req.user.userId;
      const {
        missionId
      } = req.body;

      // 필수 필드 검증
      if (!missionId) {
        apiResult.msg = 'Missing required fields: missionId';
        res.status(400).json(apiResult);
        return;
      }

      // MissionService를 통해 미션을 완료 처리합니다.
      const response = await this.missionService.completeMission(userId, missionId);
      apiResult.code = 200;
      apiResult.data = response;
      apiResult.msg = '스트레칭 미션 성공';
      res.status(200).json(apiResult);
    } catch (err) {
      console.error(err);
      apiResult.code = 500;
      apiResult.msg = '서버 에러';
      res.status(500).json(apiResult);
    }
  }
  async submitSmileImage(req, res) {
    const apiResult = {
      code: 400,
      data: null,
      msg: ''
    };
    try {
      const userId = req.user.userId;
      const {
        missionId
      } = req.body;
      if (!missionId) {
        apiResult.msg = 'Missing required fields: missionId';
        res.status(400).json(apiResult);
        return;
      }

      // 파일이 업로드 되었는지 req.file 확인
      if (!req.file) {
        apiResult.msg = 'Image file is required';
        res.status(400).json(apiResult);
        return;
      }
      const missionIdNum = parseInt(missionId);

      // 변환된 값이 NaN인지 확인
      if (isNaN(missionIdNum)) {
        apiResult.msg = '유효하지 않은 missionId 입니다.';
        res.status(400).json(apiResult);
        return;
      }
      // 이미지가 정상적으로 전송되었으면 미션 완료 처리
      await this.missionService.completeMission(userId, missionIdNum);
      apiResult.code = 200;
      apiResult.data = {
        message: 'Smile image received and mission completed'
      };
      apiResult.msg = '웃는 사진 미션 성공';
      res.status(200).json(apiResult);
    } catch (err) {
      console.error(err);
      apiResult.code = 500;
      apiResult.msg = '서버 에러';
      res.status(500).json(apiResult);
    }
  }
  async positiveChatWithPlant(req, res) {
    const apiResult = {
      code: 400,
      data: null,
      msg: ''
    };
    try {
      const userId = req.user.userId;
      const {
        missionId,
        plantId,
        message
      } = req.body;

      // 1. 필수 값 검증
      if (!missionId || !plantId || !message) {
        apiResult.msg = 'Missing required fields: missionId, plantId, message';
        res.status(400).json(apiResult);
        return;
      }

      // 2. 챗봇 응답 생성
      const chatService = new ChatService(new ChatBot());
      const chatResponse = await chatService.create(userId, plantId, message);

      // 3. 감정 분석 수행
      const emotionResult = await this.analysisService.analyzeEmotion(message);

      // 4. 감정 결과 DB 반영
      if (emotionResult) {
        await User.update({
          state: emotionResult
        }, {
          where: {
            user_id: userId
          }
        });
        console.log(`사용자 ${userId}의 감정 상태가 '${emotionResult}'으로 업데이트됨`);
      } else {
        console.log(`❌ 감정 분석 실패 → 기존 감정 상태 유지 (userId=${userId})`);
      }

      // 5. 긍정적 말하기 미션 처리 (행복일 때만 완료)
      let missionCompleted = null;
      if (emotionResult === '행복') {
        missionCompleted = await this.missionService.completeMission(userId, missionId);
      }

      // 6. 최종 응답
      apiResult.code = 200;
      apiResult.data = {
        chat_response: chatResponse,
        emotion: emotionResult,
        mission_completed: missionCompleted
      };
      apiResult.msg = missionCompleted ? 'Chat completed and mission finished successfully' : 'Chat completed but mission not finished (condition not met)';
      res.status(200).json(apiResult);
    } catch (err) {
      console.error('오류 발생:', err);
      apiResult.code = 500;
      apiResult.msg = 'ServerError';
      res.status(500).json(apiResult);
    }
  }
}