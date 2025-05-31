import type { Request, Response } from 'express';
import type { ApiResult } from '../interface/api.js';
import { MissionService } from '@/services/MissionService.js';
import { ChatService } from '@/services/ChatService.js';
import { ChatBot } from '@/services/bots/ChatBot.js';

interface DailyMission {
  start(): void;
  evaluate(): boolean;
}

const MISSION_XP = 10;

export class MissionController {
  private missionService: MissionService;

  constructor(missionService: MissionService) {
    this.missionService = missionService;
  }

  public async getMissions(req: Request, res: Response): Promise<void> {
    const result: ApiResult = { code: 400, data: null, msg: 'Failed' };

    try {
      const { user_id } = req.params;
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

  public async completeMission(req: Request, res: Response): Promise<void> {
    const result: ApiResult = { code: 400, data: null, msg: 'Failed' };

    try {
      const { user_id, mission_id } = req.body;
      const response = await this.missionService.completeMission(
        user_id,
        mission_id,
      );

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

  public async drinkWater(req: Request, res: Response): Promise<void> {
    const apiResult: ApiResult = {
      code: 400,
      data: null,
      msg: '',
    };

    try {
      const { user_id, mission_id } = req.body;
      // 사용자 id, 미션 id 중 하나라도 없을 때
      if (!user_id || !mission_id) {
        apiResult.msg = 'Missing required fields: user_id, mission_id';
        res.status(400).json(apiResult);
      }
      // 실제로 이미지가 전송되지 않을 때(추후 이미지가 전송되는 multer 작성해야함)
      if (!req.file) {
        apiResult.msg = 'Image file is required';
        res.status(400).json(apiResult);
      }

      // 이미지가 정상적으로 전송되었으면 미션 완료 처리
      const response = await this.missionService.completeMission(
        user_id,
        mission_id
      );

      apiResult.code = 200;
      apiResult.data = response;
      apiResult.msg = 'Mission completed successfully';
      res.status(200).json(apiResult);
    } catch (err) {
      apiResult.code = 500;
      apiResult.msg = 'ServerError';
      res.status(500).json(apiResult);
    }0
  }

  public async walk(req: Request, res: Response): Promise<void> {
    const apiResult: ApiResult = {
      code: 400,
      data: null,
      msg: '',
    };

    try {
      const { user_id, mission_id, steps } = req.body;
   
      // 필수 필드 검증
      if (!user_id || !mission_id || steps === undefined) {
        apiResult.msg = 'Missing required fields: user_id, mission_id, steps';
        res.status(400).json(apiResult);
        return;
      }
   
      // 걸음 수 검증
      if (typeof steps !== 'number' || steps < 1000) { // 걸어야하는 스텝 수 설정
        apiResult.msg = 'You need to walk at least 1000 steps to complete this mission';
        res.status(400).json(apiResult);
        return;
      }
   
      // 미션 완료 처리
      const response = await this.missionService.completeMission(user_id, mission_id);
   
      apiResult.code = 200;
      apiResult.data = response;
      apiResult.msg = 'Mission completed successfully';
      res.status(200).json(apiResult);
    } catch (err) {
      apiResult.code = 500;
      apiResult.msg = 'ServerError';
      res.status(500).json(apiResult);
    }
  }

  public async chatWithPlant(req: Request, res: Response): Promise<void> {
    const apiResult: ApiResult = {
      code: 400,
      data: null,
      msg: '',
    };

    try {
      const { user_id, mission_id, plant_id, message } = req.body;

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
      apiResult.code = 500;
      apiResult.msg = 'ServerError';
      res.status(500).json(apiResult);
    }
  }

  public async talkWithPlant(req: Request, res: Response): Promise<void> { // 미완료
    const apiResult: ApiResult = {
      code: 400,
      data: null,
      msg: '',
    };

    try {
    } catch (err) {
      apiResult.code = 500;
      apiResult.msg = 'ServerError';
      res.status(500).json(apiResult);
    }
  }

  public async submitSmileImage(req: Request, res: Response): Promise<void> {
    const apiResult: ApiResult = {
      code: 400,
      data: null,
      msg: '',
    };

    try {
      const { user_id, mission_id, image } = req.body;

      if (!user_id || !mission_id || !image) {
        apiResult.msg = 'Missing required fields: user_id, mission_id, image';
        res.status(400).json(apiResult);
        return;
      }
          // 조건 충족 처리만 수행
      await this.missionService.completeMission(user_id, mission_id);

      apiResult.code = 200;
      apiResult.data = { message: 'Smile image received and condition fulfilled' };
      apiResult.msg = 'Smile mission condition fulfilled';
      res.status(200).json(apiResult);
 
    } catch (err) {
      apiResult.code = 500;
      apiResult.msg = 'ServerError';
      res.status(500).json(apiResult);
    }
  }
}
