import db from "../models/index.js";
export class MissionService {
  async getMissions(userId) {
    const missions = await db.Mission.findAll({
      where: {
        user_id: userId
      },
      order: [['created_at', 'DESC']]
    });
    return missions;
  }
  async completeMission(userId, missionId) {
    const mission = await db.Mission.findOne({
      where: {
        user_id: userId,
        mission_id: missionId
      }
    });
    if (!mission) {
      throw new Error('MissionNotFound');
    }
    const updatedMission = await mission.update({
      is_completed: true,
      completed_at: new Date()
    });
    return updatedMission;
  }
}