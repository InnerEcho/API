import db from '@/models/index.js';

export class MissionService {
  public async getMissions(userId: number): Promise<any> {
    const missions = await db.Mission.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
    });

    return missions;
  }

  public async completeMission(
    userId: number,
    missionId: number,
  ): Promise<any> {
    const mission = await db.Mission.findOne({
      where: { user_id: userId, mission_id: missionId },
    });

    if (!mission) {
      throw new Error('MissionNotFound');
    }

    const updatedMission = await mission.update({
      is_completed: true,
      completed_at: new Date(),
    });

    return updatedMission;
  }
}
