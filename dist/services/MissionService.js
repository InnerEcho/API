import db from "../models/index.js";
// PlantStateService 임포트

export class MissionService {
  /**
   * MissionService를 생성합니다.
   * @param plantStateService - 식물 상태 관리를 위한 서비스
   */
  constructor(plantStateService) {
    this.plantStateService = plantStateService;
  }

  /**
   * 특정 사용자의 미션 목록을 조회합니다.
   * (현재 코드에서는 Mission 모델을 사용하고 있으나, 전체적인 흐름에 맞춰 User_Event를 조회하도록 수정하는 것을 고려해볼 수 있습니다.)
   * @param userId - 사용자 ID
   */
  async getMissions(userId) {
    // 참고: 현재 코드는 Mission 테이블을 직접 조회하고 있습니다.
    // 사용자별로 할당된 미션을 보려면 'User_Event' 테이블을 조회하는 것이 더 정확할 수 있습니다.
    const missions = await db.Mission.findAll({
      // where: { user_id: userId }, // Mission 테이블에 user_id가 있다는 가정
      order: [['created_at', 'DESC']]
    });
    return missions;
  }

  /**
   * 특정 미션(이벤트)을 완료하고, 보상(경험치)을 지급합니다.
   * @param user_id - 사용자 ID
   * @param event_id - 완료할 이벤트(미션) ID
   */
  async completeMission(user_id, event_id) {
    // 1. 완료할 미션(이벤트)이 사용자에게 할당되었는지 확인
    const userEvent = await db.User_Event.findOne({
      where: {
        user_id: user_id,
        event_id: event_id,
        status: "assigned"
      },
      raw: true
    });
    console.log(userEvent);
    if (!userEvent) {
      throw new Error('Mission not found or already completed for this user');
    }

    // 2. 미션(이벤트)의 보상(경험치) 정보 조회
    // (events 테이블에 exp_reward 컬럼이 있다고 가정)
    const eventInfo = await db.Event.findOne({
      where: {
        event_id: event_id
      },
      raw: true
    });
    console.log(eventInfo);
    if (!eventInfo || !eventInfo.exp_reward) {
      throw new Error('Event reward information not found');
    }
    const expToGain = eventInfo.exp_reward;

    // 3. 경험치를 지급할 사용자의 식물 ID 조회
    const plant = await db.Plant.findOne({
      where: {
        user_id: user_id
      }
    });
    if (!plant) {
      throw new Error("User's plant not found");
    }

    // 4. PlantStateService를 호출하여 경험치 지급!
    const expResult = await this.plantStateService.gainExperience(plant.plant_id, expToGain);

    // 5. 미션(이벤트) 상태를 '완료'로 업데이트
    await db.User_Event.update({
      status: "complete",
      completed_at: new Date()
    }, {
      where: {
        user_id: user_id,
        event_id: event_id
      }
    });

    // 6. 프론트엔드에 전달할 최종 결과 조합
    return {
      message: 'Mission completed successfully!',
      expGained: expToGain,
      plantStatus: expResult // { level, experience, leveledUp }
    };
  }
}