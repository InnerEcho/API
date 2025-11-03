import db from '@/models/index.js';
import { Op, QueryTypes, type Transaction } from 'sequelize';
import { PlantStateService } from '@/services/PlantStateService.js';
import { loadRecentHistoryMap, noveltyPenaltyById } from '@/services/mission/recentHistory.js';
import logger from '@/utils/logger.js';

// -------------------------
// [1] Context Loader (추가)
// -------------------------
async function loadUserContext(userId: number) {
  const [row]: any[] = await db.sequelize.query(
    `
    SELECT ca.emotion, ca.factor
    FROM plant_history ch
    JOIN chat_analysis ca ON ca.history_id = ch.history_id
    WHERE ch.user_id = ?
    ORDER BY ca.created_at DESC
    LIMIT 1
    `,
    { replacements: [userId], type: QueryTypes.SELECT },
  );

  if (!row) return null;

  let factor: any = {};
  try {
    factor = row.factor ? JSON.parse(row.factor) : {};
  } catch {
    factor = {};
  }

  return {
    emotion: row.emotion ?? null,
    valence: factor.valence ?? null,
    arousal: factor.arousal ?? null,
    tags: Array.isArray(factor.tags) ? factor.tags : [],
  };
}

// ----------------------------------
// [2] Context-based Score Adjustment
// ----------------------------------
function contextScore(mission: any, ctx: any): number {
  if (!ctx) return 0;

  let s = 0;

  // 1) 저각성(arousal <= 0.3) → 무거운 미션 감점
  if (typeof ctx.arousal === 'number' && ctx.arousal <= 0.3) {
    if (mission.burden >= 3) s -= 0.8;
  }

  // 2) emotionTag 매칭 가점 (간단 룰)
  const tagHits = (list: string[]) =>
    (ctx.emotion && list.includes(ctx.emotion)) ||
    (ctx.tags && ctx.tags.some((t: string) => list.includes(t)));

  if (tagHits(['무기력', 'lethargic', '귀찮음'])) {
    if (mission.code?.includes('BREATH') || mission.type === 'instant') s += 1.0;
  }
  if (tagHits(['초조', 'anxious'])) {
    if (mission.code?.includes('TAKE_A_BREATH') || mission.type === 'habit') s += 1.0;
  }

  return s;
}

// -------------------------------------
// [3] (옵션) Score Logging Stub (추후 확장)
// -------------------------------------
async function recordScoreEvent(userId: number, missionId: number, score: number) {
  // 미래에 score 저장/로그 쌓고 싶을 때 여기 구현
  // 지금은 NO-OP
  return;
}

type UMStatus = 'assigned' | 'complete' | 'skipped' | 'expired';
type ArAction = 'PET' | 'JUMP' | 'WATER' | 'SUNLIGHT';

type MissionRow = {
  mission_id: number;
  code: string;
  title: string;
  desc: string | null;
  type: 'instant' | 'action' | 'ar_optional' | 'habit';
  burden: number;
  exp_reward: number;
  ar_bonus_exp: number;
  requires_ar_action: ArAction | null;
  user_mission_status?: UMStatus | null;
  user_mission_id?: number | null;
  assigned_at?: string | null;
  expires_at?: string | null;
};

function categoryFrom(mission: MissionRow): string {
  if (mission.code === 'APP_OPEN') return '일상';
  if (mission.type === 'instant') return '일상';
  if (mission.type === 'habit') return '마음';
  if (mission.type === 'ar_optional') return '활동';
  if (mission.type === 'action') return '활동';
  return '일상';
}

function toDTO(mission: MissionRow) {
  return {
    id: mission.user_mission_id ?? mission.mission_id,
    missionId: mission.mission_id,
    title: mission.title,
    description: mission.desc ?? '',
    completed: mission.user_mission_status === 'complete',
    category: categoryFrom(mission),
    rewardExp: mission.exp_reward,
  };
}

// KST 03:00 == UTC 18:00(전날)
function next3amKST(): Date {
  const now = new Date();
  const y = now.getUTCFullYear(), m = now.getUTCMonth(), d = now.getUTCDate(), h = now.getUTCHours();
  // 오늘 UTC 18:00이 다음날 KST 03:00
  const base = new Date(Date.UTC(y, m, d, 18, 0, 0, 0));
  // 이미 UTC 18시를 지났다면 다음 날 18:00이 타겟
  if (h >= 18) base.setUTCDate(base.getUTCDate() + 1);
  return base; // UTC로 18:00Z
}

// KST 00:00 == UTC 15:00(전날)
function today0amKSTUTC(): Date {
  const now = new Date();
  const y = now.getUTCFullYear(), m = now.getUTCMonth(), d = now.getUTCDate(), h = now.getUTCHours();
  // 오늘 UTC 15:00이 KST 기준 '오늘 00:00'
  const base = new Date(Date.UTC(y, m, d, 15, 0, 0, 0));
  // 아직 UTC 15:00 전이면, 하루 전 15:00이 '오늘 00:00(KST)'
  if (h < 15) base.setUTCDate(base.getUTCDate() - 1);
  return base; // UTC로 15:00Z
}


function timeBucketKST(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const h = new Date(Date.now() + 9 * 3600 * 1000).getHours();
  if (h < 11) return 'morning';
  if (h < 17) return 'afternoon';
  if (h < 21) return 'evening';
  return 'night';
}

function softScore(code: string, type: string, bucket: ReturnType<typeof timeBucketKST>) {
  let score = 0;
  if (bucket === 'morning') {
    if (code === 'LIGHT_CHECK') score += 2;
    if (code === 'DRINK_WATER_250ML') score += 1;
    if (code === 'CHECK_HOME_PLANT') score += 1;
  }
  if (bucket === 'afternoon') {
    if (code === 'MARCH_IN_PLACE_1MIN') score += 1;
    if (code === 'STRETCH_30S') score += 1;
  }
  if (bucket === 'evening') {
    if (code === 'TAKE_A_BREATH_10S') score += 1;
    if (code === 'ONE_LINE_JOURNAL') score += 1;
  }
  if (bucket === 'night') {
    if (code === 'TAKE_A_BREATH_10S') score += 1.2;
    if (code === 'ONE_LINE_JOURNAL') score += 1.2;
    if (code === 'LOOK_OUT_WINDOW_30S') score += 0.6;
  }
  if (type === 'ar_optional') score -= 0.2;
  score += Math.random() * 0.01;
  return score;
}

const plantStateService = new PlantStateService();

export class MissionService {
  static async getToday(userId: number) {
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new Error('Invalid user context');
    }
    const start = today0amKSTUTC().toISOString().slice(0, 19).replace('T', ' ');
    const rows = await db.sequelize.query<MissionRow>(
      `
        SELECT m.*, um.id AS user_mission_id, um.status AS user_mission_status,
               um.assigned_at, um.expires_at
        FROM user_missions um
        JOIN missions m ON m.mission_id = um.mission_id
        WHERE um.user_id = :userId
          AND um.status IN ('assigned','complete')
          AND um.assigned_at >= :start
          AND (um.expires_at IS NULL OR um.expires_at > NOW())
        ORDER BY um.assigned_at ASC
      `,
      { replacements: { userId, start }, type: QueryTypes.SELECT },
    );
    return rows.map(toDTO);
  }

  // ---------------------------------------
  // ✅ 변경 주요 포인트: contextScore 반영
  // ---------------------------------------
  static async recommendIfEmpty(userId: number, n: number = 2) {
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new Error('Invalid user context');
    }
    const today = await this.getToday(userId);
    if (today.length > 0) return today;

    const candidates = await db.sequelize.query<MissionRow>(
      `SELECT * FROM missions WHERE is_active = 1 AND burden <= 2`,
      { type: QueryTypes.SELECT },
    );

    if (candidates.length === 0) {
      return today;
    }

    const bucket = timeBucketKST();
    const ctx = await loadUserContext(userId);

    const recentHistory = await loadRecentHistoryMap(userId);

    const scored = candidates
      .map(mission => {
        const missionId = mission.mission_id;
        const baseScore = softScore(mission.code, mission.type, bucket);
        const ctxScore = contextScore(mission, ctx);
        const noveltyPenalty = noveltyPenaltyById(missionId, recentHistory);
        const finalScore = baseScore + ctxScore + noveltyPenalty;

        logger.info({
          event: 'recommend_scored',
          userId,
          missionId,
          score: finalScore,
          softScore: baseScore,
          ctxAdj: ctxScore,
          noveltyPenalty,
          timeBucket: bucket,
          emotion: ctx?.emotion ?? null,
          arousal: ctx?.arousal ?? null,
        });

        recordScoreEvent(userId, missionId, finalScore);
        return { mission, score: finalScore };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.min(n, 3));

    const pick = scored.map(({ mission }) => mission);

    if (pick.length === 0) {
      return today;
    }

    const transaction: Transaction = await db.sequelize.transaction();
    try {
      const assignedAt = new Date();
      const expiresAt = next3amKST();
      for (const mission of pick) {
        const dup = await db.UserMission.findOne({
          where: {
            userId,
            missionId: mission.mission_id,
            assignedAt: { [Op.gte]: today0amKSTUTC() },
          },
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        if (dup) continue;
        const created = await db.UserMission.create(
          {
            userId,
            missionId: mission.mission_id,
            status: 'assigned',
            assignedAt,
            expiresAt,
            evidence: null,
          },
          { transaction },
        );
        logger.info({
          event: 'recommend_assigned',
          userId,
          missionId: mission.mission_id,
          userMissionId: Number(created.get('id')),
          assignedAt: assignedAt.toISOString(),
          expiresAt: expiresAt.toISOString(),
        });
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    return this.getToday(userId);
  }

  // ----- 이하 기존 코드 그대로 (생략 없이 유지) -----
  static async complete(
    userId: number,
    userMissionId: number,
    body: { arUsed?: boolean; arAction?: ArAction; evidence?: any },
  ) {
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new Error('Invalid user context');
    }
    return db.sequelize.transaction(async transaction => {
      const userMission = await db.UserMission.findOne({
        where: { id: userMissionId, userId },
        lock: transaction.LOCK.UPDATE,
        transaction,
      });

      if (!userMission) {
        throw new Error('User mission not found');
      }

      if (userMission.get('status') === 'expired') {
        throw new Error('Mission expired');
      }

      const expiresAt = userMission.get('expiresAt') as Date | null;
      if (expiresAt && expiresAt.getTime() <= Date.now()) {
        throw new Error('Mission expired');
      }

      const missionId = userMission.get('missionId') as number;

      if (userMission.get('status') === 'complete') {
        const mission = await db.Mission.findByPk(missionId, { transaction });
        const baseExp = mission ? Number(mission.get('expReward') ?? mission.get('exp_reward') ?? 0) : 0;
        return {
          message: 'Already completed',
          baseExp,
          arBonus: 0,
          expGained: 0,
          plantStatus: null,
        };
      }

      if (userMission.get('status') !== 'assigned') {
        throw new Error('Mission not assignable');
      }

      const mission = await db.Mission.findByPk(missionId, { transaction });
      if (!mission) {
        throw new Error('Mission definition missing');
      }

      const baseExp = Number(mission.get('expReward') ?? mission.get('exp_reward') ?? 0);
      const requiresArAction =
        (mission.get('requiresArAction') ?? mission.get('requires_ar_action')) as ArAction | null;
      const arBonus =
        body.arUsed && requiresArAction && body.arAction === requiresArAction
          ? Number(mission.get('arBonusExp') ?? mission.get('ar_bonus_exp') ?? 0)
          : 0;
      const gained = baseExp + arBonus;

      const plant = await db.Plant.findOne({ where: { user_id: userId }, transaction });
      if (!plant) {
        throw new Error('Plant not found for user');
      }

      const plantId = Number(plant.get('plant_id'));
      let plantStatus: any = null;
      try {
        plantStatus = await plantStateService.gainExperience(userId, plantId, gained);
      } catch (error) {
        const level = Number(plant.get('plant_level') ?? 1);
        const experience = Number(plant.get('plant_experience') ?? 0) + gained;
        plantStatus = { level, experience, leveledUp: false };
      }

      const evidencePayload = body?.evidence
        ? {
            arUsed: !!body.arUsed,
            arAction: body.arAction ?? null,
            ...(body.evidence || {}),
          }
        : null;

      userMission.set({
        status: 'complete',
        completedAt: new Date(),
        evidence: evidencePayload,
      });
      await userMission.save({ transaction });

      logger.info({
        event: 'complete_done',
        userId,
        userMissionId,
        missionId,
        baseExp,
        arBonus,
        expGained: gained,
        plantId,
        leveledUp: !!plantStatus?.leveledUp,
      });

      return { message: 'Mission completed', baseExp, arBonus, expGained: gained, plantStatus };
    });
  }

  static async assignTodayByCodes(userId: number, codes: string[] = []) {
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new Error('Invalid user context');
    }

    const uniqueCodes = [...new Set((codes || []).map(code => String(code).trim()).filter(Boolean))];
    if (uniqueCodes.length === 0) {
      return this.getToday(userId);
    }

    const start = today0amKSTUTC().toISOString().slice(0, 19).replace('T', ' ');
    const assigned = await db.sequelize.query<{ code: string }>(
      `
        SELECT m.code
        FROM user_missions um
        JOIN missions m ON m.mission_id = um.mission_id
        WHERE um.user_id = :userId
          AND um.status IN ('assigned','complete')
          AND um.assigned_at >= :start
          AND (um.expires_at IS NULL OR um.expires_at > NOW())
          AND m.code IN (:codes)
      `,
      {
        replacements: { userId, start, codes: uniqueCodes },
        type: QueryTypes.SELECT,
      },
    );

    const already = new Set(assigned.map(row => row.code));
    const targets = uniqueCodes.filter(code => !already.has(code));
    if (targets.length === 0) {
      return this.getToday(userId);
    }

    const missions = await db.Mission.findAll({
      where: {
        code: {
          [Op.in]: targets,
        },
      },
    });

    if (missions.length === 0) {
      return this.getToday(userId);
    }

    const transaction = await db.sequelize.transaction();
    try {
      const assignedAt = new Date();
      const expiresAt = next3amKST();

      for (const mission of missions) {
        const missionId = Number(mission.get('missionId') ?? mission.get('mission_id'));
        await db.UserMission.create(
          {
            userId,
            missionId,
            status: 'assigned',
            assignedAt,
            expiresAt,
            evidence: null,
          },
          { transaction },
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    return this.getToday(userId);
  }

  static async clearToday(userId: number) {
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new Error('Invalid user context');
    }

    const start = today0amKSTUTC();

    await db.UserMission.destroy({
      where: {
        userId,
        assignedAt: {
          [Op.gte]: start,
        },
      },
    });

    return this.getToday(userId);
  }
}

export default MissionService;
