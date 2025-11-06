import db from '@/models/index.js';
import { Op, QueryTypes, type Transaction } from 'sequelize';
import { PlantStateService } from '@/services/plant/PlantStateService.js';
import { loadRecentHistoryMap, noveltyPenaltyById } from '@/services/mission/recentHistory.js';
import logger from '@/utils/logger.js';
import { getMissionRecoConfig, type TimeBucket } from '@/config/missionReco.config.js';

const SM_TAU = Number(process.env.RECO_SOFTMAX_TAU ?? 0.7);
const EPSILON = Number(process.env.RECO_EPSILON ?? 0.1);
const TOPK = Number(process.env.RECO_TOPK ?? 6);
const RECO = getMissionRecoConfig();

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

function softmax(weights: number[], tau = 0.7): number[] {
  const t = Math.max(0.05, Number.isFinite(tau) ? tau : 0.7);
  const scaled = weights.map(w => w / t);
  const max = Math.max(...scaled);
  const exps = scaled.map(v => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / (sum || 1));
}

function weightedSample<T>(items: T[], probs: number[], count: number): T[] {
  const picked: T[] = [];
  const used = new Set<number>();
  const N = Math.min(count, items.length);
  for (let c = 0; c < N; c++) {
    let r = Math.random();
    let acc = 0;
    let idx = -1;
    for (let i = 0; i < items.length; i++) {
      if (used.has(i)) continue;
      acc += probs[i];
      if (r <= acc) {
        idx = i;
        break;
      }
    }
    if (idx === -1) {
      idx = items.findIndex((_v, i) => !used.has(i));
    }
    if (idx >= 0) {
      used.add(idx);
      picked.push(items[idx]);
    }
  }
  return picked;
}

function ensureDiversity(pick: ScoredMission[], want = 2): ScoredMission[] {
  const codes = new Set<string>();
  const types = new Map<string, number>();
  const out: ScoredMission[] = [];
  for (const item of pick) {
    const code = item.mission.code;
    const type = item.mission.type;
    const typeCount = types.get(type) ?? 0;
    if (codes.has(code)) continue;
    if (typeCount >= 2) continue;
    out.push(item);
    codes.add(code);
    types.set(type, typeCount + 1);
    if (out.length >= want) break;
  }
  for (const item of pick) {
    if (out.length >= want) break;
    if (!out.some(existing => existing.mission.mission_id === item.mission.mission_id)) {
      out.push(item);
    }
  }
  return out;
}

// ----------------------------------
// [2] Context-based Score Adjustment
// ----------------------------------
function matchesEmotionTags(ctx: { emotion?: string | null; tags?: string[] }, tags: string[]): boolean {
  const pool: string[] = [];
  if (ctx.emotion) pool.push(String(ctx.emotion));
  if (Array.isArray(ctx.tags)) {
    for (const tag of ctx.tags) {
      pool.push(String(tag));
    }
  }
  return pool.some(value => tags.includes(value));
}

function matchesCondition(mission: any, condition: { codes?: string[]; codeIncludes?: string[]; types?: string[] }): boolean {
  const { codes, codeIncludes, types } = condition;
  if (!codes && !codeIncludes && !types) return true;

  let ok = true;
  if (codes && codes.length > 0) {
    const missionCode = String(mission.code ?? '');
    ok = ok && codes.includes(missionCode);
  }
  if (codeIncludes && codeIncludes.length > 0) {
    const code = String(mission.code ?? '');
    ok = ok && codeIncludes.some(substr => substr && code.includes(substr));
  }
  if (types && types.length > 0) {
    ok = ok && types.includes(mission.type);
  }
  return ok;
}

function contextScore(mission: any, ctx: any): number {
  if (!ctx) return 0;

  let s = 0;

  const lowArousal = RECO.context.lowArousal;
  if (
    typeof ctx.arousal === 'number' &&
    ctx.arousal <= lowArousal.threshold &&
    typeof mission.burden === 'number' &&
    mission.burden >= lowArousal.minBurden
  ) {
    s -= lowArousal.penalty;
  }

  for (const boost of RECO.context.emotionBoosts) {
    if (!matchesEmotionTags(ctx, boost.tags)) continue;
    const conditions = boost.conditions && boost.conditions.length > 0 ? boost.conditions : [{}];
    const shouldApply = conditions.some(condition => matchesCondition(mission, condition));
    if (shouldApply) {
      s += boost.boost;
    }
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

type ScoredMission = { mission: MissionRow; score: number };

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

function softScore(code: string, type: string, bucket: TimeBucket) {
  let score = 0;
  const bucketAdjust = RECO.softScore.byBucket[bucket];
  if (bucketAdjust && bucketAdjust[code] !== undefined) {
    score += bucketAdjust[code];
  }
  if (RECO.softScore.typeAdjustments[type] !== undefined) {
    score += RECO.softScore.typeAdjustments[type];
  }
  if (RECO.softScore.jitter > 0) {
    score += Math.random() * RECO.softScore.jitter;
  }
  return score;
}

const plantStateService = new PlantStateService();

export class MissionService {
  static async getToday(userId: number) {
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new Error('Invalid user context');
    }
    const start = today0amKSTUTC().toISOString().slice(0, 19).replace('T', ' ');
    const rows = (await db.sequelize.query(
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
    )) as MissionRow[];
    return rows.map(mission => toDTO(mission));
  }

  // ---------------------------------------
  // ✅ 변경 주요 포인트: contextScore 반영
  // ---------------------------------------
  static async recommendIfEmpty(userId: number, n: number = 2) {
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new Error('Invalid user context');
    }
    const startedAt = Date.now();

    const logLatency = () =>
      logger.info({
        event: 'recommend_latency',
        userId,
        ms: Date.now() - startedAt,
      });

    const today = await this.getToday(userId);
    if (today.length > 0) {
      logLatency();
      return today;
    }

    const maxBurden = RECO.candidateFilter.maxBurden;
    let candidates: MissionRow[];
    if (maxBurden !== null && maxBurden !== undefined) {
      candidates = (await db.sequelize.query(
        `SELECT * FROM missions WHERE is_active = 1 AND burden <= :maxBurden`,
        { replacements: { maxBurden }, type: QueryTypes.SELECT },
      )) as MissionRow[];
    } else {
      candidates = (await db.sequelize.query(
        `SELECT * FROM missions WHERE is_active = 1`,
        { type: QueryTypes.SELECT },
      )) as MissionRow[];
    }

    try {
      const lastRows = (await db.sequelize.query(
        `
        SELECT um.mission_id, MAX(um.assigned_at) AS last_assigned_at
        FROM user_missions um
        WHERE um.user_id = :userId
        GROUP BY um.mission_id
        `,
        { replacements: { userId }, type: QueryTypes.SELECT },
      )) as Array<{ mission_id: number; last_assigned_at: string | null }>;
      const lastMap = new Map<number, number>();
      for (const row of lastRows) {
        if (row.last_assigned_at) {
          lastMap.set(Number(row.mission_id), new Date(row.last_assigned_at).getTime());
        }
      }
      let wouldSkip = 0;
      const now = Date.now();
      for (const mission of candidates) {
        const cooldownSec =
          (mission as any).cooldown_sec ??
          (mission as any).cooldownSec ??
          0;
        if (!cooldownSec) continue;
        const lastTs = lastMap.get(mission.mission_id) ?? 0;
        if (now - lastTs < cooldownSec * 1000) {
          wouldSkip++;
        }
      }
      if (wouldSkip > 0) {
        logger.info({
          event: 'cooldown_filter_dryrun',
          userId,
          candidates: candidates.length,
          wouldSkip,
        });
      }
    } catch (error) {
      logger.warn({
        event: 'cooldown_filter_dryrun_error',
        userId,
        error: (error as Error).message,
      });
    }

    if (candidates.length === 0) {
      logLatency();
      return today;
    }

    const bucket = timeBucketKST();
    const ctx = await loadUserContext(userId);

    const recentHistory = await loadRecentHistoryMap(userId, RECO.novelty.historyDays);

    const scoredRaw: ScoredMission[] = candidates.map(mission => {
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
    });

    const sorted: ScoredMission[] = [...scoredRaw].sort((a, b) => b.score - a.score);

    const k = Math.max(1, Math.min(Number.isFinite(TOPK) ? TOPK : 6, sorted.length));
    const topK = sorted.slice(0, k);

    const want = Math.min(n, 3, topK.length);

    const probs = want > 0 ? softmax(topK.map(entry => entry.score), SM_TAU) : [];

    let picked: ScoredMission[] = want > 0 ? weightedSample<ScoredMission>(topK, probs, want) : [];

    if (
      Math.random() < Math.max(0, Math.min(Number.isFinite(EPSILON) ? EPSILON : 0.1, 1)) &&
      sorted.length > want
    ) {
      const rest = sorted
        .slice(k)
        .filter(item =>
          !picked.some(existing => existing.mission.mission_id === item.mission.mission_id),
        );
      if (rest.length > 0) {
        picked.push(rest[Math.floor(Math.random() * rest.length)]);
        picked = [...picked].sort((a, b) => b.score - a.score).slice(0, want);
      }
    }

    picked = ensureDiversity(picked, want);

    if (picked.length > 0) {
      const scores = picked.map(item => item.score);
      const min = Math.min(...scores);
      const max = Math.max(...scores);
      const avg = scores.reduce((acc, value) => acc + value, 0) / scores.length;
      logger.info({
        event: 'recommend_summary',
        userId,
        timeBucket: bucket,
        size: picked.length,
        summary: {
          min: Number(min.toFixed(4)),
          max: Number(max.toFixed(4)),
          avg: Number(avg.toFixed(4)),
        },
        picks: picked.map(item => ({
          missionId: item.mission.mission_id,
          score: Number(item.score.toFixed(4)),
        })),
      });
    }

    const pick = picked.map(({ mission }) => mission);

    if (pick.length === 0) {
      logLatency();
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
      logLatency();
      throw error;
    }

    const nextMissions = await this.getToday(userId);
    logLatency();
    return nextMissions;
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
    return db.sequelize.transaction(async (transaction: Transaction) => {
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
    const assigned = (await db.sequelize.query(
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
    )) as Array<{ code: string }>;

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

    const transaction: Transaction = await db.sequelize.transaction();
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
