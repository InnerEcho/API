import db from "../models/index.js";
import { QueryTypes } from 'sequelize';
export class PlantStateService {
  async getPlantState(plant_id) {
    const plantDb = await db.sequelize.query(`
        SELECT p.nickname, p.current_temp, p.current_light, p.current_moisture, 
               p.temp_state, p.light_state, p.moisture_state
        FROM plant p
        WHERE p.plant_id = ${plant_id};
      `, {
      type: QueryTypes.SELECT
    });
    if (!plantDb || plantDb.length === 0) {
      throw new Error('Not Exists PlantData');
    }
    const plant = plantDb[0];
    return {
      plant_id: plant_id,
      plant_name: plant.nickname,
      current_temp: {
        value: plant.current_temp,
        state: plant.temp_state
      },
      current_light: {
        value: plant.current_light,
        state: plant.light_state
      },
      current_moisture: {
        value: plant.current_moisture / 10,
        state: plant.moisture_state
      },
      watering_cycle: 7,
      // 더미 데이터
      last_watered_date: '2024-12-01T10:00:00Z',
      // 더미 데이터
      last_measured_date: '2024-12-08T15:30:00Z' // 더미 데이터
    };
  }
  async updatePlantState(plant_id, state) {
    const plant = await db.Plant.findOne({
      where: {
        plant_id: plant_id
      }
    });
    if (!plant) {
      throw new Error('PlantNotFound');
    }
    const updatedPlant = await plant.update({
      current_temp: state.temperature,
      current_light: state.light,
      current_moisture: state.moisture * 10,
      temp_state: state.temperature_state,
      light_state: state.light_state,
      moisture_state: state.moisture_state,
      last_measured_date: new Date()
    });
    return updatedPlant;
  }
}