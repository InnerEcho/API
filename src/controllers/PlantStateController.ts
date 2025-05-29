import type { Request, Response } from 'express';
import type { ApiResult } from '../interface/api.js';
import db from '../models/index.js';
import type { Sequelize } from 'sequelize';
import { QueryTypes } from 'sequelize';

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

class PlantStateController {
  private sequelize: Sequelize;

  constructor(sequelize: Sequelize) {
    this.sequelize = sequelize;
  }

  /**
   * 🌱 식물 상태 조회
   */
  public async getPlantState(req: Request, res: Response): Promise<void> {
    let apiResult: ApiResult = {
      code: 400,
      data: null,
      msg: 'Failed',
    };

    try {
      const { user_id: userId, plant_id: plantId } = req.body;

      const plantDb = await this.sequelize.query<PlantDbResult>(
        `
          SELECT p.nickname, p.current_temp, p.current_light, p.current_moisture, 
                 p.temp_state, p.light_state, p.moisture_state
          FROM user u, plant p
          WHERE u.user_id = ${userId} AND p.plant_id = ${plantId};
        `,
        { type: QueryTypes.SELECT },
      );

      if (!plantDb || plantDb.length === 0) {
        apiResult.code = 404;
        apiResult.msg = 'Not Exists PlantData';
      } else {
        const plant = plantDb[0];
        // 식물 데이터 객체 생성
        const plantData: PlantData = {
          plant_id: plantId,
          user_id: userId,
          plant_name: plant.nickname,
          current_temp: {
            value: plant.current_temp,
            state: plant.temp_state,
          },
          current_light: {
            value: plant.current_light,
            state: plant.light_state,
          },
          current_moisture: {
            value: plant.current_moisture / 10,
            state: plant.moisture_state,
          },
          watering_cycle: 7, // 더미 데이터
          last_watered_date: '2024-12-01T10:00:00Z', // 더미 데이터
          last_measured_date: '2024-12-08T15:30:00Z', // 더미 데이터
        };

        console.log(plantData);

        apiResult.code = 200;
        apiResult.data = plantData;
        apiResult.msg = 'Ok';
      }
    } catch (err) {
      apiResult.code = 500;
      apiResult.data = null;
      apiResult.msg = 'ServerError';
      console.error(err);
    }

    res.json(apiResult);
  }
}

export default new PlantStateController(db.sequelize);
