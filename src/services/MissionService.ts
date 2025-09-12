import db from '@/models/index.js';

export class MissionService {
  public async getMissions(user_id: number): Promise<any> {
    const missions = await db.Mission.findAll({
      where: { user_id: user_id },
      order: [['created_at', 'DESC']],
    });

    return missions;
  }

  // public async startMission(
  //   user_id: number,
  //   mission_id: number,
  // ): Promise<any> {
  //   const mission = await db.Mission.findOne({
  //     where: { user_id: user_id, mission_id: mission_id },
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
  //   user_id: number,
  //   mission_id: number,
  //   steps: number
  // ): Promise<any> {
  //   const mission = await db.Mission.findOne({
  //     where: { 
  //       user_id: user_id, 
  //       mission_id: mission_id,
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
  //     await this.completeMission(user_id, mission_id);
  //   }

  //   return updatedMission;
  // }

  public async completeMission(
    user_id: number,
    event_id: number,
  ): Promise<any> {
    const mission = await db.User_Event.findOne({
      where: { user_id: user_id, event_id: event_id },
    });

    if (!mission) {
      throw new Error('MissionNotFound');
    }

    const updatedMission = await db.User_Event.update(
      {
      status: 'completed',
      is_completed: true,
      completed_at: new Date(),
      },
      {
      where: { user_id: user_id, event_id: event_id },  
      }
  );

    return updatedMission;
  }
}
