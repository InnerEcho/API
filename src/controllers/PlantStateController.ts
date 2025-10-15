import type { Request, Response } from 'express';
import { PlantStateService } from '@/services/PlantStateService.js';
import type { ApiResult } from '@/interface/index.js';

export class PlantStateController {
  private plantStateService: PlantStateService;

  constructor(plantStateService: PlantStateService) {
    this.plantStateService = plantStateService;
  }

  public getPlantsByUserId = async(req:Request, res:Response): Promise<void> => {
    const result: ApiResult = { code: 400, data: null, msg: 'Failed' };

    try{
      const userId = req.user!.userId;

      if (!userId) {
        result.code = 401;
        result.msg = 'Unauthorized';
        res.status(401).json(result);
        return;
      }

      const plantDataByUser = await this.plantStateService.getPlantsByUserId(
        userId
      );

      result.code = 200;
      result.msg = 'Ok';
      result.data = plantDataByUser;
      res.status(200).json(result);
    } catch (error) {
      console.error('Error in getPlantsByUserId:', error);
      if (error instanceof Error) {
        if (error.message === 'Plant not found') {
          result.code = 404;
          result.msg = error.message;
          res.status(404).json(result);
        } else {
          result.code = 500;
          result.msg = 'ServerError';
          res.status(500).json(result);
        }
      } else {
        result.code = 500;
        result.msg = 'ServerError';
        res.status(500).json(result);
      }
    }
  }

  /**
   * GET /plant-state/:plant_id
   * 특정 식물의 현재 상태를 조회합니다.
   */
  public getPlantState = async (req: Request, res: Response): Promise<void> => {
    // 응답 객체 초기화
    const result: ApiResult = { code: 400, data: null, msg: 'Failed' };

    try {
      const plantId = parseInt(req.params.plantId, 10);
      const userId = req.user!.userId;

      if (isNaN(plantId)) {
        result.code = 400;
        result.msg = 'Invalid plant ID';
        res.status(400).json(result);
        return;
      }

      const plantData = await this.plantStateService.getPlantState(
        plantId,
        userId,
      );

      // 성공 시 응답 형식 통일
      result.code = 200;
      result.msg = 'Ok';
      result.data = plantData;
      res.status(200).json(result);
    } catch (error) {
      console.error('Error in getPlantState:', error);
      if (error instanceof Error) {
        if (error.message === 'Plant not found') {
          result.code = 404;
          result.msg = error.message;
          res.status(404).json(result);
        } else if (error.message === 'Forbidden') {
          result.code = 403;
          result.msg = 'Access denied';
          res.status(403).json(result);
        } else {
          result.code = 500;
          result.msg = 'ServerError';
          res.status(500).json(result);
        }
      } else {
        result.code = 500;
        result.msg = 'ServerError';
        res.status(500).json(result);
      }
    }
  };

  /**
   * POST /plant-state/:plant_id/experience
   * 식물에게 경험치를 부여합니다.
   */
  public gainExperience = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const result: ApiResult = { code: 400, data: null, msg: 'Failed' };

    try {
      const plantId = parseInt(req.params.plantId, 10);
      const userId = req.user!.userId;
      const { expGained } = req.body;

      if (isNaN(plantId) || typeof expGained !== 'number' || expGained <= 0) {
        result.code = 400;
        result.msg = 'Invalid input data';
        res.status(400).json(result);
        return;
      }

      const serviceResult = await this.plantStateService.gainExperience(
        plantId,
        userId,
        expGained,
      );

      result.code = 200;
      result.msg = 'Ok';
      result.data = serviceResult;
      res.status(200).json(result);
    } catch (error) {
      console.error('Error in gainExperience:', error);
      if (error instanceof Error) {
        if (error.message === 'Plant not found') {
          result.code = 404;
          result.msg = error.message;
          res.status(404).json(result);
        } else if (error.message === 'Forbidden') {
          result.code = 403;
          result.msg = 'Access denied';
          res.status(403).json(result);
        } else {
          result.code = 500;
          result.msg = 'ServerError';
          res.status(500).json(result);
        }
      } else {
        result.code = 500;
        result.msg = 'ServerError';
        res.status(500).json(result);
      }
    }
  };

  /**
   * POST /plant-state/:plant_id/likeability
   * 식물의 호감도를 증가시킵니다.
   */
  public increaseLikeability = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const result: ApiResult = { code: 400, data: null, msg: 'Failed' };

    try {
      const plantId = parseInt(req.params.plantId, 10);
      const userId = req.user!.userId;
      const { amount } = req.body;

      if (isNaN(plantId) || typeof amount !== 'number' || amount <= 0) {
        result.code = 400;
        result.msg = 'Invalid input data';
        res.status(400).json(result);
        return;
      }

      const serviceResult = await this.plantStateService.increaseLikeability(
        plantId,
        userId,
        amount,
      );

      result.code = 200;
      result.msg = 'Ok';
      result.data = serviceResult;
      res.status(200).json(result);
    } catch (error) {
      console.error('Error in increaseLikeability:', error);
      if (error instanceof Error) {
        if (error.message === 'Plant not found') {
          result.code = 404;
          result.msg = error.message;
          res.status(404).json(result);
        } else if (error.message === 'Forbidden') {
          result.code = 403;
          result.msg = 'Access denied';
          res.status(403).json(result);
        } else {
          result.code = 500;
          result.msg = 'ServerError';
          res.status(500).json(result);
        }
      } else {
        result.code = 500;
        result.msg = 'ServerError';
        res.status(500).json(result);
      }
    }
  };
}
