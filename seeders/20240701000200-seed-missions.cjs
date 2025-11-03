'use strict';

const missionSeeds = () => {
  const now = new Date();
  return [
    // instant
    {
      code: 'APP_OPEN',
      title: '앱 켜보기',
      desc: '홈 화면으로 식물 살펴보기',
      type: 'instant',
      burden: 1,
      exp_reward: 5,
      ar_bonus_exp: 0,
      requires_ar_action: null,
      cooldown_sec: 0,
      is_active: 1,
      created_at: now,
      updated_at: now
    },
    {
      code: 'CHECK_HOME_PLANT',
      title: '오늘 식물 안부 보기',
      desc: '식물 상태 한 번 확인하기',
      type: 'instant',
      burden: 1,
      exp_reward: 5,
      ar_bonus_exp: 0,
      requires_ar_action: null,
      cooldown_sec: 0,
      is_active: 1,
      created_at: now,
      updated_at: now
    },
    // habit (마음·정리)
    {
      code: 'TAKE_A_BREATH_10S',
      title: '10초 숨 고르기',
      desc: '천천히 10초 호흡',
      type: 'habit',
      burden: 1,
      exp_reward: 5,
      ar_bonus_exp: 0,
      requires_ar_action: null,
      cooldown_sec: 0,
      is_active: 1,
      created_at: now,
      updated_at: now
    },
    {
      code: 'ONE_LINE_JOURNAL',
      title: '한 줄 기록',
      desc: '오늘 느낌 한 문장',
      type: 'habit',
      burden: 1,
      exp_reward: 5,
      ar_bonus_exp: 0,
      requires_ar_action: null,
      cooldown_sec: 0,
      is_active: 1,
      created_at: now,
      updated_at: now
    },
    {
      code: 'LOOK_OUT_WINDOW_30S',
      title: '창밖 30초 바라보기',
      desc: '잠깐 시야 멀리 두기',
      type: 'habit',
      burden: 1,
      exp_reward: 5,
      ar_bonus_exp: 0,
      requires_ar_action: null,
      cooldown_sec: 0,
      is_active: 1,
      created_at: now,
      updated_at: now
    },
    {
      code: 'POSTURE_CHECK_10S',
      title: '자세 정렬 10초',
      desc: '어깨 펴고 턱 당기기',
      type: 'habit',
      burden: 1,
      exp_reward: 5,
      ar_bonus_exp: 0,
      requires_ar_action: null,
      cooldown_sec: 0,
      is_active: 1,
      created_at: now,
      updated_at: now
    },
    // action (가벼운 몸쓰기)
    {
      code: 'STRETCH_30S',
      title: '30초 스트레칭',
      desc: '목·어깨 가볍게 늘리기',
      type: 'action',
      burden: 1,
      exp_reward: 5,
      ar_bonus_exp: 0,
      requires_ar_action: null,
      cooldown_sec: 0,
      is_active: 1,
      created_at: now,
      updated_at: now
    },
    {
      code: 'MARCH_IN_PLACE_1MIN',
      title: '제자리걷기 1분',
      desc: '가볍게 무릎만 들어 올려요',
      type: 'action',
      burden: 1,
      exp_reward: 5,
      ar_bonus_exp: 0,
      requires_ar_action: null,
      cooldown_sec: 0,
      is_active: 1,
      created_at: now,
      updated_at: now
    },
    {
      code: 'MARCH_IN_PLACE_3MIN',
      title: '제자리걷기 3분',
      desc: '호흡 편한 속도로',
      type: 'action',
      burden: 2,
      exp_reward: 5,
      ar_bonus_exp: 0,
      requires_ar_action: null,
      cooldown_sec: 0,
      is_active: 1,
      created_at: now,
      updated_at: now
    },
    {
      code: 'LIGHT_CHECK',
      title: '햇빛/조명 체크',
      desc: '창가/조명 밝기 점검',
      type: 'action',
      burden: 1,
      exp_reward: 5,
      ar_bonus_exp: 0,
      requires_ar_action: null,
      cooldown_sec: 0,
      is_active: 1,
      created_at: now,
      updated_at: now
    },
    {
      code: 'CHAT_WITH_PLANT',
      title: '식물에게 말 걸기',
      desc: '한 문장으로 인사/대화',
      type: 'action',
      burden: 1,
      exp_reward: 5,
      ar_bonus_exp: 0,
      requires_ar_action: null,
      cooldown_sec: 0,
      is_active: 1,
      created_at: now,
      updated_at: now
    },
    // habit (건강/섭취)
    {
      code: 'DRINK_WATER_250ML',
      title: '물 250ml 마시기',
      desc: '컵 한 잔 정도',
      type: 'habit',
      burden: 1,
      exp_reward: 5,
      ar_bonus_exp: 0,
      requires_ar_action: null,
      cooldown_sec: 0,
      is_active: 1,
      created_at: now,
      updated_at: now
    },
    {
      code: 'DRINK_WATER_1L',
      title: '물 1L 마시기',
      desc: '하루 누적 목표 체크',
      type: 'habit',
      burden: 2,
      exp_reward: 5,
      ar_bonus_exp: 0,
      requires_ar_action: null,
      cooldown_sec: 0,
      is_active: 1,
      created_at: now,
      updated_at: now
    },
    {
      code: 'DRINK_TEA',
      title: '티 한 잔 준비하기',
      desc: '따뜻한 차로 잠깐 휴식',
      type: 'habit',
      burden: 1,
      exp_reward: 5,
      ar_bonus_exp: 0,
      requires_ar_action: null,
      cooldown_sec: 0,
      is_active: 1,
      created_at: now,
      updated_at: now
    },
    // action (이미지/미소)
    {
      code: 'SUBMIT_SMILE',
      title: '스마일 사진 제출',
      desc: '미소 사진을 한 장 올려요',
      type: 'action',
      burden: 1,
      exp_reward: 5,
      ar_bonus_exp: 0,
      requires_ar_action: null,
      cooldown_sec: 0,
      is_active: 1,
      created_at: now,
      updated_at: now
    },
    // AR (선택 보너스)
    {
      code: 'AR_PET_ONCE',
      title: 'AR로 쓰다듬기 1회',
      desc: 'AR에서 식물 쓰다듬기',
      type: 'ar_optional',
      burden: 1,
      exp_reward: 5,
      ar_bonus_exp: 3,
      requires_ar_action: 'PET',
      cooldown_sec: 0,
      is_active: 1,
      created_at: now,
      updated_at: now
    },
    {
      code: 'AR_JUMP_ONCE',
      title: 'AR로 점프 1회',
      desc: '더블탭으로 점프',
      type: 'ar_optional',
      burden: 1,
      exp_reward: 5,
      ar_bonus_exp: 3,
      requires_ar_action: 'JUMP',
      cooldown_sec: 0,
      is_active: 1,
      created_at: now,
      updated_at: now
    },
    {
      code: 'AR_WATER_ONCE',
      title: 'AR로 물주기 1회',
      desc: '물주기 제스처/버튼',
      type: 'ar_optional',
      burden: 2,
      exp_reward: 5,
      ar_bonus_exp: 3,
      requires_ar_action: 'WATER',
      cooldown_sec: 0,
      is_active: 1,
      created_at: now,
      updated_at: now
    },
    {
      code: 'AR_SUNLIGHT_ONCE',
      title: 'AR로 햇빛주기 1회',
      desc: '햇빛 비춰주기',
      type: 'ar_optional',
      burden: 2,
      exp_reward: 5,
      ar_bonus_exp: 3,
      requires_ar_action: 'SUNLIGHT',
      cooldown_sec: 0,
      is_active: 1,
      created_at: now,
      updated_at: now
    }
  ];
};

const upsertSql = [
  'INSERT INTO missions (code, title, `desc`, type, burden, exp_reward, ar_bonus_exp, requires_ar_action, cooldown_sec, is_active, created_at, updated_at)',
  'VALUES (:code, :title, :desc, :type, :burden, :exp_reward, :ar_bonus_exp, :requires_ar_action, :cooldown_sec, :is_active, :created_at, :updated_at)',
  'ON DUPLICATE KEY UPDATE',
  '  title = VALUES(title),',
  '  `desc` = VALUES(`desc`),',
  '  type = VALUES(type),',
  '  burden = VALUES(burden),',
  '  exp_reward = VALUES(exp_reward),',
  '  ar_bonus_exp = VALUES(ar_bonus_exp),',
  '  requires_ar_action = VALUES(requires_ar_action),',
  '  cooldown_sec = VALUES(cooldown_sec),',
  '  is_active = VALUES(is_active),',
  '  updated_at = VALUES(updated_at);'
].join('\n');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const missions = missionSeeds();

    for (const mission of missions) {
      await queryInterface.sequelize.query(upsertSql, { replacements: mission });
    }
  },

  async down(queryInterface) {
    const missions = missionSeeds();
    const missionCodes = missions.map((mission) => mission.code);
    const { Op } = queryInterface.sequelize.Sequelize;

    await queryInterface.bulkDelete('missions', {
      code: { [Op.in]: missionCodes }
    });
  }
};
