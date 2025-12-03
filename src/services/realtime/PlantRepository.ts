import db from '@/models/index.js';

export interface PlantInfoRecord {
  nickname: string;
  userName: string;
  speciesName: string;
}

export class PlantRepository {
  public async getPlantInfo(userId: number, plantId: number): Promise<PlantInfoRecord | null> {
    const plant = await db.Plant.findOne({
      where: {
        user_id: userId,
        plant_id: plantId,
      },
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['user_name'],
        },
        {
          model: db.Species,
          as: 'species',
          attributes: ['species_name'],
        },
      ],
    });

    if (!plant) {
      return null;
    }

    return {
      userName: plant.get('user')?.user_name,
      nickname: plant.get('nickname'),
      speciesName: plant.get('species')?.species_name,
    };
  }
}
