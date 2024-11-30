import { Request, Response } from 'express';
import { ApiResult } from '../interface/api';
import { PlantData } from '../interface/plant';
import db from '../models/index';

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
    const userName = req.body.user_name; //사용자 이름 추출
    const plantId = req.body.plant_id; //식물 이름 추출

    const plantData = await db.sequelize.query(
      `
        SELECT p.current_temp, p.current_light, p.current_moisture, p.temp_state, p.light_state, p.moisture_state
        FROM user u, plant p
        WHERE u.user_id = p.user_id AND u.user_name = '${userName}' AND p.plant_id = ${plantId};
      ` ,
      {
        type: db.Sequelize.QueryTypes.SELECT,
      },
    );

    console.log(plantData);

    if (plantData.length > 0) {
      apiResult.code = 200;
      apiResult.data = plantData[0];
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
