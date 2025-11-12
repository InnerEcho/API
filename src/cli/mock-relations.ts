import 'dotenv/config';
import db from '@/models/index.js';
import { QueryTypes } from 'sequelize';
import { PERSONAS, type PersonaKey, type PersonaParams } from './personas.js';

/*
================================================================================
  이 스크립트는 mock-users.ts가 실행된 *이후*에 실행해야 합니다.
  
  1. (mock-users.ts) user, user_missions 생성
  2. (이 스크립트)   plant, plant_history, chat_analysis, growth_diary, user_friends 생성
================================================================================
*/

type MockUser = {
  userId: number;
  email: string;
  persona: PersonaKey;
  plantId?: number; // 2단계에서 할당됨
};

type Opts = {
  days: number;
  seed: number;
  userPrefix: string;
};

// ---------- (시작) mock-users.ts의 헬퍼 함수 재사용 ----------

function parseArgs(): Opts {
  const argv = process.argv.slice(2);
  const map = new Map<string, string>();
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const [key, inlineValue] = arg.slice(2).split('=');
    if (inlineValue !== undefined) {
      map.set(key, inlineValue);
      continue;
    }
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      map.set(key, next);
      i++;
    } else {
      map.set(key, 'true');
    }
  }
  const parseNum = (value: string | undefined, fallback: number) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };
  return {
    days: Math.max(1, parseNum(map.get('days'), 14)),
    seed: parseNum(map.get('seed'), 42),
    userPrefix: map.get('userPrefix') ?? 'mock',
  };
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWeighted<T>(rng: () => number, items: T[], weights: number[]) {
  const sum = weights.reduce((acc, w) => acc + w, 0) || 1;
  let r = rng() * sum;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

function kstDate(daysAgo: number, hour: number, minute = 0) {
  const now = new Date();
  const kstNow = new Date(now.getTime() + 9 * 3600 * 1000);
  const kstMidnight = new Date(kstNow.getFullYear(), kstNow.getMonth(), kstNow.getDate(), 0, 0, 0, 0);
  const kstTarget = new Date(kstMidnight.getTime() - daysAgo * 24 * 3600 * 1000);
  kstTarget.setHours(hour, minute, Math.floor(Math.random() * 50), Math.floor(Math.random() * 900));
  return new Date(kstTarget.getTime() - 9 * 3600 * 1000);
}

function hourFromBucket(rng: () => number, bucket: 'morning' | 'afternoon' | 'evening' | 'night') {
  if (bucket === 'morning') return 7 + Math.floor(rng() * 4); // 07~10
  if (bucket === 'afternoon') return 13 + Math.floor(rng() * 4); // 13~16
  if (bucket === 'evening') return 19 + Math.floor(rng() * 2); // 19~20
  return 22 + Math.floor(rng() * 2); // 22~23 (night)
}

function isPersonaKey(value: string): value is PersonaKey {
  return value in PERSONAS;
}
// ---------- (끝) mock-users.ts의 헬퍼 함수 재사용 ----------

/**
 * 1단계: mock-users.ts로 생성된 모든 모의 사용자를 로드합니다.
 */
async function loadMockUsers(prefix: string): Promise<MockUser[]> {
  const likePattern = `${prefix}+%`;
  const rows = (await db.sequelize.query(
    `SELECT user_id, user_email FROM \`user\`
     WHERE user_email LIKE :likePattern
     ORDER BY user_id`,
    { replacements: { likePattern }, type: QueryTypes.SELECT },
  )) as Array<{ user_id: number; user_email: string }>;

  return rows.map((row: { user_id: number; user_email: string }) => {
    const match = row.user_email.match(/\+([a-z0-9]+)_/i);
    const key = match?.[1]?.toUpperCase() ?? '';
    const persona = (isPersonaKey(key) ? key : 'A1') as PersonaKey;
    return {
      userId: Number(row.user_id),
      email: row.user_email,
      persona,
    };
  });
}

/**
 * 2단계: 모든 모의 사용자에게 기본 식물(plant)을 할당합니다.
 */
/**
 * 2단계: 모든 모의 사용자에게 기본 식물(plant)을 할당합니다.
 */
async function ensureUserPlants(users: MockUser[]) {
  const DEFAULT_SPECIES_ID = 1;
  const DEFAULT_NICKNAME = '금쪽이';

  for (const user of users) {
    // [수정됨] 'created_at' 및 'updated_at' 컬럼 삽입 제거
    // (src/models/userPlant.ts의 timestamps: false 설정 준수)
    // [수정됨] last_measured_date 컬럼 추가 (모델 파일 67-72줄)
    await db.sequelize.query(
      `INSERT INTO \`plant\` (user_id, species_id, nickname, plant_level, plant_experience, plant_hogamdo, last_measured_date)
       VALUES (:userId, :speciesId, :nickname, 1, 0, 50, NOW())
       ON DUPLICATE KEY UPDATE
         nickname = VALUES(nickname),
         last_measured_date = NOW()`, // ON DUPLICATE KEY UPDATE에도 last_measured_date 추가
      {
        replacements: {
          userId: user.userId,
          speciesId: DEFAULT_SPECIES_ID,
          nickname: DEFAULT_NICKNAME,
        },
        type: QueryTypes.INSERT,
      },
    );

    // (이 부분은 수정 없음 - plant_id를 가져오는 로직)
    const [plantRow] = (await db.sequelize.query(
      `SELECT plant_id FROM \`plant\` WHERE user_id = :userId LIMIT 1`,
      { replacements: { userId: user.userId }, type: QueryTypes.SELECT },
    )) as Array<{ plant_id: number }>;

    if (plantRow) {
      user.plantId = Number(plantRow.plant_id);
    }
  }
  console.log(`🌱 ${users.length}명의 사용자에게 식물을 할당했습니다.`);
}

// ---------- 3단계: 채팅 및 감정 생성을 위한 헬퍼 (수정) ----------

const getPersonaEmotion = (
  persona: PersonaParams,
): { emotion: string; factor: string } => {
  const rng = Math.random;

  // E1 (Challenger), A1 (Morning-Habit) - 긍정적/성취
  if (persona.completionProb > 0.75 && persona.burdenMean > 2.5) {
    return pickWeighted(
      rng,
      [
        { emotion: '성취감', factor: '미션 완료' },
        { emotion: '기쁨', factor: '새로운 발견' },
        { emotion: '활기참', factor: '아침 산책' },
      ],
      [0.5, 0.3, 0.2],
    );
  }

  // E2 (Avoider), A2 (Night-HighBurden) - 부정적/지침
  if (persona.skipProb > 0.15 || persona.burdenMean > 3.5) {
    return pickWeighted(
      rng,
      [
        { emotion: '지침', factor: '업무 스트레스' },
        { emotion: '불안', factor: '미래에 대한 걱정' },
        { emotion: '우울', factor: '반복되는 일상' },
        { emotion: '피곤함', factor: '늦은 퇴근' },
      ],
      [0.4, 0.2, 0.2, 0.2],
    );
  }

  // C2 (Calm-lean), B1 (ARShy) - 차분함/일상
  if (persona.burdenMean < 2.0) {
    return pickWeighted(
      rng,
      [
        { emotion: '평온', factor: '휴식' },
        { emotion: '생각', factor: '오늘의 대화' },
        { emotion: '소소함', factor: '따뜻한 차 한잔' },
        { emotion: '일상', factor: '특별한 일 없음' },
      ],
      [0.4, 0.2, 0.2, 0.2],
    );
  }

  // 기본
  return pickWeighted(
    rng,
    [
      { emotion: '일상', factor: '그냥저냥' },
      { emotion: '무난', factor: '늘 하던 일' },
      { emotion: '생각', factor: '친구와의 약속' },
      { emotion: '기대', factor: '주말 계획' },
    ],
    [0.4, 0.2, 0.2, 0.2],
  );
};

const getMockMessages = (persona: PersonaParams): { userMsg: string; botMsg: string } => {
  const { emotion, factor } = getPersonaEmotion(persona);
  
  return {
    userMsg: `오늘은 왠지 ${factor} 때문에 ${emotion}을(를) 느껴.`,
    botMsg: `그렇군요. ${emotion}을(를) 느끼셨다니, ${factor}에 대해 좀 더 이야기해 주시겠어요?`,
  };
};

/**
 * 3/4단계: 채팅(plant_history) 및 감정(chat_analysis) 생성
 * (사용자 요청: emotion, factor는 NULL이 아님)
 */
async function generateChatAndAnalysis(
  users: MockUser[],
  opts: Opts,
  rng: () => number,
) {
  const personaMap: Record<PersonaKey, PersonaParams> = PERSONAS;
  let chatCount = 0;
  let analysisCount = 0;

  for (const user of users) {
    const persona = personaMap[user.persona];
    if (!persona || !user.plantId) continue;

    for (let day = opts.days - 1; day >= 0; day--) {
      if (rng() > (persona.completionProb * 0.8 + 0.1)) continue;
      const chatSessions = 1 + Math.floor(rng() * 3);

      for (let i = 0; i < chatSessions; i++) {
        const buckets: Array<'morning' | 'afternoon' | 'evening' | 'night'> = [
          'morning', 'afternoon', 'evening', 'night',
        ];
        const chosenBucket = pickWeighted(
          rng,
          buckets,
          buckets.map(bucket => persona.timeBucketWeights[bucket]),
        );
        const hour = hourFromBucket(rng, chosenBucket);
        const chatTime = kstDate(day, hour, Math.floor(rng() * 50));
        
        const { userMsg, botMsg } = getMockMessages(persona);

        // 1. 사용자 메시지 삽입 (plant_history)
        // [경고] 이 테이블이 DB에 없으면 여기서 실패합니다.
        const [userChatId] = (await db.sequelize.query(
          `INSERT INTO \`plant_history\` (user_id, plant_id, message, user_type, send_date, created_at, updated_at)
           VALUES (:userId, :plantId, :message, 'User', :sendDate, NOW(), NOW())`,
          {
            replacements: {
              userId: user.userId,
              plantId: user.plantId,
              message: userMsg,
              sendDate: chatTime,
            },
            type: QueryTypes.INSERT,
          },
        )) as [number, unknown];
        
        chatCount++;

        // 2. (핵심) 감정 분석 데이터 삽입 (chat_analysis)
        // [수정됨] 'desc chat_analysis' 스키마와 100% 일치시킴
        // (user_id, plant_id, message, send_date, analyzed_at 제거)
        // (created_at 추가)
        const { emotion, factor } = getPersonaEmotion(persona);
        await db.sequelize.query(
          `INSERT INTO \`chat_analysis\` (history_id, emotion, factor, created_at)
           VALUES (:historyId, :emotion, :factor, NOW())`,
          {
            replacements: {
              historyId: userChatId,
              emotion: emotion,
              factor: factor,
            },
            type: QueryTypes.INSERT,
          },
        );
        analysisCount++;

        // 3. 봇 응답 메시지 삽입 (plant_history)
        const botTime = new Date(chatTime.getTime() + 5000);
        await db.sequelize.query(
          `INSERT INTO \`plant_history\` (user_id, plant_id, message, user_type, send_date, created_at, updated_at)
           VALUES (:userId, :plantId, :message, 'Bot', :sendDate, NOW(), NOW())`,
          {
            replacements: {
              userId: user.userId,
              plantId: user.plantId,
              message: botMsg,
              sendDate: botTime,
            },
            type: QueryTypes.INSERT,
          },
        );
        chatCount++;
      }
    }
  }
  console.log(`💬 채팅 ${chatCount}개 및 🕵️ 감정 분석 ${analysisCount}개를 생성했습니다.`);
}

/**
 * 4단계: 성장 일기 (growth_diary) 생성
 */
async function generateDiaries(users: MockUser[], opts: Opts, rng: () => number) {
  let diaryCount = 0;
  for (const user of users) {
    if (!user.plantId) continue;
    
    // [수정됨] 'send_date' -> 'created_at' (chat_analysis 스키마 기준)
    const analyses = (await db.sequelize.query(
      `SELECT
         DATE(created_at) as diary_date,
         emotion,
         factor
       FROM \`chat_analysis\`
       WHERE history_id IN (SELECT history_id FROM \`plant_history\` WHERE user_id = :userId)
       GROUP BY diary_date, emotion, factor
       ORDER BY diary_date DESC`,
      { replacements: { userId: user.userId }, type: QueryTypes.SELECT }
    )) as Array<{ diary_date: string; emotion: string; factor: string }>;
    
    if (!analyses.length) continue;

    const uniqueDates = [...new Set(analyses.map(a => a.diary_date))];

    for (const dateStr of uniqueDates) {
      const persona = PERSONAS[user.persona];
      if (rng() > (persona.completionProb * 0.5)) continue;

      const representative = analyses.find(a => a.diary_date === dateStr);
      if (!representative) continue;

      const [missionRow] = (await db.sequelize.query(
        `SELECT m.title
         FROM \`user_missions\` um
         JOIN \`missions\` m ON um.mission_id = m.mission_id
         WHERE um.user_id = :userId AND um.status = 'complete'
           AND DATE(um.completed_at) = :dateStr
         ORDER BY um.completed_at ASC
         LIMIT 1`,
        { replacements: { userId: user.userId, dateStr }, type: QueryTypes.SELECT }
      )) as Array<{ title: string }>;

      const primaryMission = missionRow?.title ?? '특별한 미션 없음';
      const title = `${dateStr}의 일기`;
      const content = `오늘은 ${representative.factor}(으)로 ${representative.emotion}을(를) 느꼈다. 그리고 "${primaryMission}" 미션을 완료했다.`;

      // [수정됨] growth_diary 스키마에 맞게 (date, created_at, updated_at 추가)
      await db.sequelize.query(
        `INSERT INTO \`growth_diary\` (user_id, plant_id, title, content, emotion, emotion_factor, primary_mission, date, created_at, updated_at)
         VALUES (:userId, :plantId, :title, :content, :emotion, :factor, :mission, :date, NOW(), NOW())
         ON DUPLICATE KEY UPDATE
           content = VALUES(content),
           emotion = VALUES(emotion),
           emotion_factor = VALUES(factor),
           primary_mission = VALUES(mission),
           updated_at = NOW()`,
        {
          replacements: {
            userId: user.userId,
            plantId: user.plantId,
            title: title,
            content: content,
            emotion: representative.emotion,
            factor: representative.factor,
            mission: primaryMission,
            date: dateStr,
          },
          type: QueryTypes.INSERT,
        },
      );
      diaryCount++;
    }
  }
  console.log(`📔 성장 일기 ${diaryCount}개를 생성했습니다.`);
}

/**
 * 5단계: 친구 관계 (user_friends) 생성
 */
async function generateFriends(users: MockUser[], rng: () => number) {
  let friendCount = 0;
  const userIds = users.map(u => u.userId);

  for (const user of users) {
    const targetFriendCount = 2 + Math.floor(rng() * 4);
    
    for (let i = 0; i < targetFriendCount; i++) {
      let targetId = userIds[Math.floor(rng() * userIds.length)];
      if (targetId === user.userId) continue;

      // [수정됨] 'userFriends' -> 'user_friends' (src/models/userFriends.ts의 tableName 기준)
      await db.sequelize.query(
        `INSERT INTO \`user_friends\` (user_id, friend_id, status, created_at, updated_at)
         VALUES (:userId, :friendId, 'accepted', NOW(), NOW())
         ON DUPLICATE KEY UPDATE updated_at = NOW()`,
        {
          replacements: { userId: user.userId, friendId: targetId },
          type: QueryTypes.INSERT
        }
      );
      
      // [수정됨] 'userFriends' -> 'user_friends'
      await db.sequelize.query(
        `INSERT INTO \`user_friends\` (user_id, friend_id, status, created_at, updated_at)
         VALUES (:userId, :friendId, 'accepted', NOW(), NOW())
         ON DUPLICATE KEY UPDATE updated_at = NOW()`,
        {
          replacements: { userId: targetId, friendId: user.userId },
          type: QueryTypes.INSERT
        }
      );
      friendCount += 2;
    }
  }
  console.log(`👥 친구 관계 ${friendCount}개 (양방향)를 생성했습니다.`);
}

/**
 * ===============================================================
 * 메인 실행 함수
 * ===============================================================
 */
async function main() {
  const opts = parseArgs();
  const rng = mulberry32(opts.seed);

  // 1단계: 모의 사용자 로드
  const users = await loadMockUsers(opts.userPrefix);
  if (!users.length) {
    console.error('🛑 모의 사용자를 찾을 수 없습니다. mock-users.ts를 먼저 실행하세요.');
    process.exit(1);
  }
  console.log(`✅ ${users.length}명의 모의 사용자를 로드했습니다.`);

  // 2단계: 식물 생성
  await ensureUserPlants(users);

  // 3단계: 채팅 및 감정 분석 생성
  await generateChatAndAnalysis(users, opts, rng);
  
  // 4단계: 성장 일기 생성
  await generateDiaries(users, opts, rng);

  // 5단계: 친구 관계 생성
  await generateFriends(users, rng);

  console.log('✅ 모든 관련 더미데이터 생성이 완료되었습니다.');
  await db.sequelize.close();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});