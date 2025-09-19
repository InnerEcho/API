import db from "@/models/index.js";

// 반환될 식물 데이터의 인터페이스
interface PlantData {
  plant_name: string;
  level: number;
  experience: number;
  likeability: number;
}

// 레벨업 계산에 사용될 상수
const BASE_EXP = 100;
const FACTOR_EXP = 1.2;

/**
 * 식물의 상태(레벨, 경험치, 호감도)를 관리하는 서비스 클래스
 */
export class PlantStateService {
  
  /**
   * 특정 레벨에 도달하기 위해 필요한 총 경험치를 계산합니다.
   * @param level - 목표 레벨
   * @returns {number} - 필요한 경험치
   */
  private calculateRequiredExp(level: number): number {
    return Math.floor(BASE_EXP * Math.pow(level, FACTOR_EXP));
  }

  /**
   * 특정 식물의 현재 상태를 조회합니다.
   * @param plant_id - 조회할 식물의 ID
   * @returns {Promise<PlantData>} - 식물의 상태 데이터
   */
  public async getPlantState(plant_id: number): Promise<PlantData> {
    const plantDb = await db.Plant.findOne({
      where: {
        plant_id: plant_id,
      },
    });

    if (!plantDb) {
      throw new Error("Plant not found");
    }

    const plantData: PlantData = {
      plant_name: plantDb.nickname,
      level: plantDb.plant_level,
      experience: plantDb.plant_experience,
      likeability: plantDb.plant_hogamdo,
    };

    return plantData;
  }

  /**
   * 식물에게 경험치를 부여하고, 필요 시 레벨업을 처리합니다.
   * @param plant_id - 경험치를 부여할 식물의 ID
   * @param expGained - 획득한 경험치 양
   * @returns {Promise<object>} - 변경된 식물 상태 (레벨, 경험치, 레벨업 여부)
   */
  public async gainExperience(plant_id: number, expGained: number): Promise<{ level: number, experience: number, leveledUp: boolean }> {
    const plant = await db.Plant.findOne({ where: { plant_id } });
    if (!plant) {
      throw new Error("Plant not found");
    }
    
    // 호감도에 따른 보너스 경험치 적용 (예: 호감도 100일 때 10% 추가)
    const bonusExp = expGained * (plant.plant_hogamdo / 1000); 
    let currentExperience = plant.plant_experience + expGained + bonusExp;
    let currentLevel = plant.plant_level;
    let leveledUp = false;

    // 레벨업 체크
    let requiredExp = this.calculateRequiredExp(currentLevel);
    while (currentExperience >= requiredExp) {
      currentLevel++;
      currentExperience -= requiredExp;
      leveledUp = true;
      requiredExp = this.calculateRequiredExp(currentLevel);
    }

    // DB 업데이트
    await db.Plant.update({
      plant_level: currentLevel,
      plant_experience: Math.floor(currentExperience),
    }, {
      where: { plant_id },
    });

    return {
      level: currentLevel,
      experience: Math.floor(currentExperience),
      leveledUp: leveledUp,
    };
  }

  /**
   * 식물의 호감도를 증가시킵니다. (최대 100)
   * @param plant_id - 호감도를 증가시킬 식물의 ID
   * @param amount - 증가시킬 호감도 양
   * @returns {Promise<object>} - 변경된 호감도 값
   */
  public async increaseLikeability(plant_id: number, amount: number): Promise<{ likeability: number }> {
    const plant = await db.Plant.findOne({ where: { plant_id } });
    if (!plant) {
      throw new Error("Plant not found");
    }

    const newLikeability = Math.min(plant.plant_hogamdo + amount, 100);

    // DB 업데이트
    await db.Plant.update({
      plant_hogamdo: newLikeability,
    }, {
      where: { plant_id },
    });
    
    return {
      likeability: newLikeability,
    };
  }
}

// import db from '@/models/index.js';
// import { QueryTypes } from 'sequelize';
// import type { PlantData } from '@/interface/plant.js';

// export class PlantStateService {
//   public async getPlantState(plant_id: number): Promise<PlantData> {
//     const plantDb = await db.sequelize.query(
//       `
//         SELECT p.nickname, p.current_temp, p.current_light, p.current_moisture, 
//                p.temp_state, p.light_state, p.moisture_state
//         FROM plant p
//         WHERE p.plant_id = ${plant_id};
//       `,
//       { type: QueryTypes.SELECT },
//     );

//     if (!plantDb || plantDb.length === 0) {
//       throw new Error('Not Exists PlantData');
//     }

//     const plant = plantDb[0];
//     return {
//       plant_id: plant_id,
//       plant_name: plant.nickname,
//       current_temp: {
//         value: plant.current_temp,
//         state: plant.temp_state,
//       },
//       current_light: {
//         value: plant.current_light,
//         state: plant.light_state,
//       },
//       current_moisture: {
//         value: plant.current_moisture / 10,
//         state: plant.moisture_state,
//       },
//       watering_cycle: 7, // 더미 데이터
//       last_watered_date: '2024-12-01T10:00:00Z', // 더미 데이터
//       last_measured_date: '2024-12-08T15:30:00Z', // 더미 데이터
//     };
//   }

//   public async updatePlantState(plant_id: number, state: any): Promise<any> {
//     const plant = await db.Plant.findOne({ where: { plant_id: plant_id } });

//     if (!plant) {
//       throw new Error('PlantNotFound');
//     }

//     const updatedPlant = await plant.update({
//       current_temp: state.temperature,
//       current_light: state.light,
//       current_moisture: state.moisture * 10,
//       temp_state: state.temperature_state,
//       light_state: state.light_state,
//       moisture_state: state.moisture_state,
//       last_measured_date: new Date(),
//     });

//     return updatedPlant;
//   }
// }
