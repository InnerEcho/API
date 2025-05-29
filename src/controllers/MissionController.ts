import type { Request, Response } from 'express';
import type { ApiResult } from '../interface/api.js';
import { MissionService } from '@/services/MissionService.js';

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
      //물마시는 이미지 받기
      //물마시는 이미지인지 판단
      //판단 결과 반환
    } catch (err) {
      apiResult.code = 500;
      apiResult.msg = 'ServerError';
      res.status(500).json(apiResult);
    }
  }

  public async walk(req: Request, res: Response): Promise<void> {
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

  public async chatWithPlant(req: Request, res: Response): Promise<void> {
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

  public async talkWithPlant(req: Request, res: Response): Promise<void> {
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
    } catch (err) {
      apiResult.code = 500;
      apiResult.msg = 'ServerError';
      res.status(500).json(apiResult);
    }
  }
}
