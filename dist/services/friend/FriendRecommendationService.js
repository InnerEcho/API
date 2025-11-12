import { Op, QueryTypes } from 'sequelize';
import db from "../../models/index.js";
import logger from "../../utils/logger.js";
import { getFriendRecoConfig } from "../../config/friendReco.config.js";
const BURDEN_MIN = 1;
const BURDEN_MAX = 5;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const normBurden = value => clamp((value - BURDEN_MIN) / (BURDEN_MAX - BURDEN_MIN), 0, 1);
const dot = (a, b) => a.reduce((sum, v, i) => sum + v * b[i], 0);
const norm = vec => {
  const magnitude = Math.sqrt(dot(vec, vec));
  return magnitude === 0 ? 1 : magnitude;
};
const cosine = (a, b) => dot(a, b) / (norm(a) * norm(b));
const oppositeScore = (a, b) => (1 - cosine(a, b)) / 2;
const hourKST = utcDate => new Date(utcDate.getTime() + 9 * 3600 * 1000).getHours();
const isDayHour = hour => hour >= 6 && hour <= 10 || hour >= 13 && hour <= 16;
const isNightHour = hour => hour >= 19 && hour <= 23 || hour < 6;
function toSamples(rows) {
  const map = new Map();
  for (const row of rows) {
    const userId = Number(row.user_id);
    const ts = row.ts instanceof Date ? row.ts : new Date(row.ts);
    const burden = row.burden ?? 0;
    const arUsed = Number(row.ar_used ?? 0);
    const sample = {
      userId,
      type: row.type,
      burden: Number.isFinite(burden) ? Number(burden) : 0,
      status: row.status,
      arUsed: Number.isFinite(arUsed) ? Number(arUsed) : 0,
      ts
    };
    const list = map.get(userId);
    if (list) {
      list.push(sample);
    } else {
      map.set(userId, [sample]);
    }
  }
  return map;
}
function buildProfile(userId, samples, arLaplace) {
  const total = samples.length;
  if (total === 0) return null;
  const activityCount = samples.filter(sample => sample.type === 'action' || sample.type === 'ar_optional').length;
  const calmCount = samples.filter(sample => sample.type === 'habit' || sample.type === 'instant').length;
  const activityBias = clamp(activityCount / total - calmCount / total, -1, 1);
  const completed = samples.filter(sample => sample.status === 'complete');
  const completedCount = completed.length;
  const arPrefRaw = completedCount > 0 ? completed.reduce((sum, sample) => sum + (sample.arUsed >= 1 ? 1 : 0), 0) / completedCount : 0;
  const arScore = clamp(arPrefRaw * (1 - arLaplace) + arLaplace, 0, 1);
  const burdenAvg = completedCount > 0 ? completed.reduce((sum, sample) => sum + sample.burden, 0) / completedCount : 2.5;
  const burdenScore = normBurden(burdenAvg);
  const hours = completed.map(sample => hourKST(sample.ts));
  const dayRatio = hours.length ? hours.filter(isDayHour).length / hours.length : 0;
  const nightRatio = hours.length ? hours.filter(isNightHour).length / hours.length : 0;
  const timeBias = clamp(nightRatio - dayRatio, -1, 1);
  const vec = [activityBias, arScore, burdenScore, timeBias];
  return {
    userId,
    samples: total,
    activityBias,
    arScore,
    burdenScore,
    timeBias,
    vec
  };
}
function compatibleBurden(a, b, tolerance) {
  return Math.abs(a - b) <= tolerance;
}
export class FriendRecommendationService {
  async recommendOpposites(userId, requestedTopN) {
    const config = getFriendRecoConfig();
    const topN = Math.max(1, Math.floor(requestedTopN ?? config.defaultTopN));
    const user = await db.User.findOne({
      where: {
        user_id: userId
      }
    });
    if (!user) {
      logger.warn({
        event: 'friends_reco_user_missing',
        userId
      });
      return {
        userId,
        topN,
        results: []
      };
    }
    const myEmail = user.get('user_email');
    const since = new Date(Date.now() - config.days * 24 * 3600 * 1000);
    const relations = await db.UserFriends.findAll({
      where: {
        [Op.or]: [{
          user_email: myEmail
        }, {
          friend_email: myEmail
        }],
        status: {
          [Op.in]: ['pending', 'accepted', 'blocked']
        }
      }
    });
    const relatedEmails = new Set();
    for (const relation of relations) {
      const from = relation.get('user_email');
      const to = relation.get('friend_email');
      if (from === myEmail && to) {
        relatedEmails.add(to);
      } else if (to === myEmail && from) {
        relatedEmails.add(from);
      }
    }
    const relatedIds = new Set([userId]);
    if (relatedEmails.size > 0) {
      const relatedUsers = await db.User.findAll({
        where: {
          user_email: {
            [Op.in]: Array.from(relatedEmails)
          }
        }
      });
      for (const related of relatedUsers) {
        relatedIds.add(Number(related.get('user_id')));
      }
    }
    const rows = await db.sequelize.query(`
        SELECT
          um.user_id,
          m.type,
          m.burden,
          um.status,
          COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(um.evidence, '$.arUsed')) AS DECIMAL(10,4)), 0) AS ar_used,
          COALESCE(um.completed_at, um.assigned_at) AS ts
        FROM user_missions um
        JOIN missions m ON m.mission_id = um.mission_id
        WHERE COALESCE(um.completed_at, um.assigned_at) >= :since
      `, {
      replacements: {
        since
      },
      type: QueryTypes.SELECT
    });
    const sampleMap = toSamples(rows);
    const profiles = [];
    for (const [id, samples] of sampleMap.entries()) {
      const profile = buildProfile(id, samples, config.arLaplace);
      if (!profile) continue;
      if (profile.samples < config.minSamples) continue;
      profiles.push(profile);
    }
    const me = profiles.find(profile => profile.userId === userId);
    if (!me) {
      logger.info({
        event: 'friends_reco_insufficient_data',
        userId,
        samples: sampleMap.get(userId)?.length ?? 0
      });
      return {
        userId,
        topN,
        results: []
      };
    }
    const candidates = profiles.filter(profile => {
      if (profile.userId === userId) return false;
      if (relatedIds.has(profile.userId)) return false;
      return compatibleBurden(me.burdenScore, profile.burdenScore, config.burdenTolerance);
    });
    const ranked = candidates.map(profile => ({
      userId: profile.userId,
      score: Number(oppositeScore(me.vec, profile.vec).toFixed(4)),
      activityBias: profile.activityBias,
      arScore: profile.arScore,
      burdenScore: profile.burdenScore,
      timeBias: profile.timeBias,
      samples: profile.samples,
      userName: null
    })).sort((a, b) => b.score - a.score).slice(0, topN);
    if (ranked.length > 0) {
      const candidateIds = ranked.map(candidate => candidate.userId);
      const users = await db.User.findAll({
        attributes: ['user_id', 'user_name'],
        where: {
          user_id: {
            [Op.in]: candidateIds
          }
        }
      });
      const nameMap = new Map();
      for (const userRecord of users) {
        const id = Number(userRecord.get('user_id'));
        if (!Number.isFinite(id)) continue;
        const rawName = userRecord.get('user_name');
        nameMap.set(id, typeof rawName === 'string' ? rawName : null);
      }
      for (const candidate of ranked) {
        candidate.userName = nameMap.get(candidate.userId) ?? null;
      }
    }
    logger.info({
      event: 'friends_reco_summary',
      userId,
      considered: candidates.length,
      returned: ranked.length,
      config: {
        days: config.days,
        minSamples: config.minSamples,
        burdenTolerance: config.burdenTolerance
      }
    });
    if (ranked.length > 0) {
      logger.info({
        event: 'friends_reco_top3',
        userId,
        picks: ranked.slice(0, Math.min(3, ranked.length))
      });
    }
    return {
      userId,
      topN,
      results: ranked
    };
  }
}