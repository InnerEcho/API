import { Request, Response } from 'express';
import { ApiResult } from '../interface/api';
import db from '../models/index';

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

export const getPlantState = async (
  req: Request,
  res: Response,
): Promise<any> => {
  let apiResult: ApiResult = {
    code: 400,
    data: null,
    msg: 'Failed',
  };

  try {
    const userId = req.body.user_id; //사용자 이름 추출
    const plantId = req.body.plant_id; //식물 이름 추출

    const plantDb = await db.sequelize.query(
      `
        SELECT p.nickname, p.current_temp, p.current_light, p.current_moisture, p.temp_state, p.light_state, p.moisture_state
        FROM user u, plant p
        WHERE u.user_id = ${userId} AND p.plant_id = ${plantId};
      `,
      {
        type: db.Sequelize.QueryTypes.SELECT,
      },
    );


    // 더미 데이터 정의
    const plantData: PlantData = {
      plant_id: plantId,
      user_id: userId,
      plant_name: `${plantDb[0].nickname}`,
      current_temp: {
        value: plantDb[0].current_temp,
        state: `${plantDb[0].temp_state}`,
      },
      current_light: {
        value: plantDb[0].current_light,
        state: `${plantDb[0].light_state}`,
      },
      current_moisture: {
        value: plantDb[0].current_moisture/10,
        state: `${plantDb[0].moisture_state}`,
      },
      watering_cycle: 7,
      last_watered_date: '2024-12-01T10:00:00Z',
      last_measured_date: '2024-12-08T15:30:00Z',
    }; 

    console.log(plantData);

    if (plantDb.length > 0) {
      apiResult.code = 200;
      apiResult.data = plantData;
      apiResult.msg = 'Ok';
    } else {
      apiResult.code = 404;
      apiResult.msg = 'Not Exits PlantData';
    }
  } catch (err) {
    apiResult.code = 500;
    apiResult.data = null;
    apiResult.msg = 'ServerError';
    console.log(err);
  }

  res.json(apiResult);
};
