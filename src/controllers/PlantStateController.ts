import type { Request, Response } from 'express';
import type { ApiResult } from '@/interface/api.js';
import { PlantStateService } from '@/services/PlantStateService.js';

// PlantData 인터페이스 정의
interface PlantData {
  plant_id: number;
  user_id: number;
  plant_name: string;
  current_temp: {
    value: number;
    state: string;
  };
  current_light: {
    value: number;
    state: string;
  };
  current_moisture: {
    value: number;
    state: string;
  };
  watering_cycle: number;
  last_watered_date: string;
  last_measured_date: string;
}

interface PlantDbResult {
  nickname: string;
  current_temp: number;
  current_light: number;
  current_moisture: number;
  temp_state: string;
  light_state: string;
  moisture_state: string;
}

export class PlantStateController {
  private plantStateService: PlantStateService;

  constructor(plantStateService: PlantStateService) {
    this.plantStateService = plantStateService;
  }

  /**
   * 🌱 식물 상태 조회
   */
  public async getPlantState(req: Request, res: Response): Promise<void> {
    const result: ApiResult = { code: 400, data: null, msg: 'Failed' };

    try {
      const { plant_id } = req.params;
      const response = await this.plantStateService.getPlantState(
        parseInt(plant_id),
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

  public async updatePlantState(req: Request, res: Response): Promise<void> {
    const result: ApiResult = { code: 400, data: null, msg: 'Failed' };

    try {
      const { plant_id } = req.params;
      const { state } = req.body;
      const response = await this.plantStateService.updatePlantState(
        parseInt(plant_id),
        state,
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
}
