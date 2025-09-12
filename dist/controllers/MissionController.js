import { ChatService } from "../services/ChatService.js";
import { ChatBot } from "../services/bots/ChatBot.js";
const MISSION_XP = 10;
export class MissionController {
  constructor(missionService) {
    this.missionService = missionService;
  }
  async getMissions(req, res) {
    const result = {
      code: 400,
      data: null,
      msg: 'Failed'
    };
    try {
      const {
        user_id
      } = req.body;
      const response = await this.missionService.getMissions(parseInt(user_id));
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
      const {
        user_id,
        mission_id
      } = req.body;
      const response = await this.missionService.completeMission(user_id, mission_id);
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
      const {
        user_id,
        mission_id
      } = req.body;
      // 사용자 id, 미션 id 중 하나라도 없을 때
      if (!user_id || !mission_id) {
        apiResult.msg = 'Missing required fields: user_id, mission_id';
        res.status(400).json(apiResult);
        return;
      }
      // 실제로 이미지가 전송되지 않을 때(추후 이미지가 전송되는 multer 작성해야함)
      if (!req.file) {
        apiResult.msg = 'Image file is required';
        res.status(400).json(apiResult);
        return;
      }
      const User_Id = parseInt(user_id);
      const Mission_Id = parseInt(mission_id);

      // 변환된 값이 NaN인지 확인
      if (isNaN(User_Id) || isNaN(Mission_Id)) {
        apiResult.msg = '유효하지 않은 user_id 또는 mission_id 입니다.';
        res.status(400).json(apiResult);
        return;
      }
      // 이미지가 정상적으로 전송되었으면 미션 완료 처리
      const response = await this.missionService.completeMission(User_Id, Mission_Id);
      apiResult.code = 200;
      apiResult.data = response;
      apiResult.msg = 'Mission completed successfully';
      res.status(200).json(apiResult);
    } catch (err) {
      console.error("오류 발생:", err); // 에러 로그 추가
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
      const {
        user_id,
        mission_id,
        plant_id,
        message
      } = req.body;

      // 필수 필드 검증
      if (!user_id || !mission_id || !plant_id || !message) {
        apiResult.msg = 'Missing required fields: user_id, mission_id, plant_id, message';
        res.status(400).json(apiResult);
        return;
      }

      // 챗봇과 대화 처리
      const chatService = new ChatService(new ChatBot());
      const chatResponse = await chatService.create(user_id, plant_id, message); // 미션 수락 후 한번 대화하도록

      // 대화가 성공적으로 이루어졌으면 미션 완료 처리
      if (chatResponse) {
        // 사용자가 미션완료 클릭 시 미션완료 되도록 바꿔야 함
        const response = await this.missionService.completeMission(user_id, mission_id);
        apiResult.code = 200;
        apiResult.data = {
          chat_response: chatResponse,
          mission_completed: response
        };
        apiResult.msg = 'Chat completed and mission finished successfully';
        res.status(200).json(apiResult);
      }
    } catch (err) {
      console.error("오류 발생:", err);
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
      const {
        user_id,
        mission_id
      } = req.body;

      // 필수 필드 검증
      if (!user_id || !mission_id) {
        apiResult.msg = 'Missing required fields: user_id, mission_id';
        res.status(400).json(apiResult);
        return;
      }

      // MissionService를 통해 미션을 완료 처리합니다.
      const response = await this.missionService.completeMission(user_id, mission_id);
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
      const {
        user_id,
        mission_id
      } = req.body;
      if (!user_id || !mission_id) {
        apiResult.msg = 'Missing required fields: user_id, mission_id';
        res.status(400).json(apiResult);
        return;
      }

      // 파일이 업로드 되었는지 req.file 확인
      if (!req.file) {
        apiResult.msg = 'Image file is required';
        res.status(400).json(apiResult);
        return;
      }
      const User_Id = parseInt(user_id);
      const Mission_Id = parseInt(mission_id);

      // 변환된 값이 NaN인지 확인
      if (isNaN(User_Id) || isNaN(Mission_Id)) {
        apiResult.msg = '유효하지 않은 user_id 또는 mission_id 입니다.';
        res.status(400).json(apiResult);
        return;
      }
      // 이미지가 정상적으로 전송되었으면 미션 완료 처리
      const response = await this.missionService.completeMission(User_Id, Mission_Id);
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
}