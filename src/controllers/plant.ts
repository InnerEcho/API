import { Request, Response } from "express";
import { ApiResult } from "../interface/api";
import db from "../models/index";

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

class PlantStateController {
  /**
   * 🌱 식물 상태 조회
   */
  public async getPlantState(req: Request, res: Response): Promise<void> {
    let apiResult: ApiResult = {
      code: 400,
      data: null,
      msg: "Failed",
    };

    try {
      const { user_id: userId, plant_id: plantId } = req.body;

      const plantDb = await db.sequelize.query(
        `
          SELECT p.nickname, p.current_temp, p.current_light, p.current_moisture, 
                 p.temp_state, p.light_state, p.moisture_state
          FROM user u, plant p
          WHERE u.user_id = ${userId} AND p.plant_id = ${plantId};
        `,
        { type: db.Sequelize.QueryTypes.SELECT }
      );

      if (!plantDb || plantDb.length === 0) {
        apiResult.code = 404;
        apiResult.msg = "Not Exists PlantData";
      } else {
        // 식물 데이터 객체 생성
        const plantData: PlantData = {
          plant_id: plantId,
          user_id: userId,
          plant_name: plantDb[0].nickname,
          current_temp: {
            value: plantDb[0].current_temp,
            state: plantDb[0].temp_state,
          },
          current_light: {
            value: plantDb[0].current_light,
            state: plantDb[0].light_state,
          },
          current_moisture: {
            value: plantDb[0].current_moisture / 10,
            state: plantDb[0].moisture_state,
          },
          watering_cycle: 7, // 더미 데이터
          last_watered_date: "2024-12-01T10:00:00Z", // 더미 데이터
          last_measured_date: "2024-12-08T15:30:00Z", // 더미 데이터
        };

        console.log(plantData);

        apiResult.code = 200;
        apiResult.data = plantData;
        apiResult.msg = "Ok";
      }
    } catch (err) {
      apiResult.code = 500;
      apiResult.data = null;
      apiResult.msg = "ServerError";
      console.error(err);
    }

    res.json(apiResult);
  }


  
}

// 🌱 PlantStateController 인스턴스 생성 후 export
export default new PlantStateController();
