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

  // public async startMission(
  //   userId: number,
  //   missionId: number,
  // ): Promise<any> {
  //   const mission = await db.Mission.findOne({
  //     where: { user_id: userId, mission_id: missionId },
  //   });

  //   if (!mission) {
  //     throw new Error('MissionNotFound');
  //   }

  //   // 미션 시작 상태로 업데이트
  //   const updatedMission = await mission.update({
  //     status: 'in_progress',
  //     started_at: new Date(),
  //     progress: 0
  //   });

  //   return updatedMission;
  // }

  // public async updateWalkProgress(
  //   userId: number,
  //   missionId: number,
  //   steps: number
  // ): Promise<any> {
  //   const mission = await db.Mission.findOne({
  //     where: { 
  //       user_id: userId, 
  //       mission_id: missionId,
  //       status: 'in_progress'
  //     },
  //   });

  //   if (!mission) {
  //     throw new Error('MissionNotFound or NotStarted');
  //   }

  //   // 걸음 수 진행 상황 업데이트
  //   const updatedMission = await mission.update({
  //     progress: steps,
  //     last_updated: new Date()
  //   });

  //   // 목표 걸음 수 달성 시 미션 완료
  //   if (steps >= 1000) {
  //     await this.completeMission(userId, missionId);
  //   }

  //   return updatedMission;
  // }

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
      status: 'completed',
      is_completed: true,
      completed_at: new Date()
    });
    return updatedMission;
  }
}