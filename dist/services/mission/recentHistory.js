import db from "../../models/index.js";
import { QueryTypes } from 'sequelize';
import { getMissionRecoConfig } from "../../config/missionReco.config.js";
const RECO = getMissionRecoConfig();
const STATUS_VALUES = ['assigned', 'complete', 'skipped', 'expired'];
const VALID_STATUS_SET = new Set(STATUS_VALUES);
function normalizeStatuses(values) {
  const unique = [];
  for (const value of values) {
    if (!VALID_STATUS_SET.has(value)) continue;
    const typed = value;
    if (unique.includes(typed)) continue;
    unique.push(typed);
  }
  return unique;
}
const DEFAULT_STATUSES = (() => {
  const normalized = normalizeStatuses(RECO.novelty.statuses ?? []);
  if (normalized.length > 0) return normalized;
  return ['assigned', 'complete'];
})();
const DEFAULT_HISTORY_DAYS = Math.max(1, RECO.novelty.historyDays ?? 3);
const MAX_DAYS = (() => {
  const envValue = Number(process.env.RECENT_HISTORY_MAX_DAYS);
  if (Number.isFinite(envValue)) {
    return Math.max(DEFAULT_HISTORY_DAYS, Math.max(1, Math.floor(envValue)));
  }
  return Math.max(DEFAULT_HISTORY_DAYS, 30);
})();
export async function loadRecentHistoryMap(userId, days = DEFAULT_HISTORY_DAYS, opts) {
  const clampedDays = Math.max(1, Math.min(Math.floor(days || 0), MAX_DAYS));
  const requestedStatuses = opts?.statuses?.length ? opts.statuses : DEFAULT_STATUSES;
  const filteredStatuses = requestedStatuses.filter(status => VALID_STATUS_SET.has(status));
  const statuses = filteredStatuses.length > 0 ? Array.from(new Set(filteredStatuses)) : DEFAULT_STATUSES;
  const since = new Date(Date.now() - clampedDays * 24 * 60 * 60 * 1000);
  const rows = await db.sequelize.query(`
    SELECT um.mission_id, COUNT(*) AS cnt
    FROM user_missions um
    WHERE um.user_id = :userId
      AND um.status IN (:statuses)
      AND COALESCE(um.completed_at, um.assigned_at) >= :since
    GROUP BY um.mission_id
    `, {
    replacements: {
      userId,
      statuses,
      since
    },
    type: QueryTypes.SELECT
  });
  const map = new Map();
  for (const row of rows) {
    map.set(Number(row.mission_id), Number(row.cnt) || 0);
  }
  return map;
}
export function noveltyPenaltyById(missionId, recentMap) {
  const cnt = recentMap.get(missionId) ?? 0;
  const penalties = RECO.novelty.penaltiesByCount;
  if (!Array.isArray(penalties) || penalties.length === 0) {
    return 0;
  }
  const index = Math.min(Math.max(0, Math.floor(cnt)), penalties.length - 1);
  const value = Number(penalties[index]);
  return Number.isFinite(value) ? value : 0;
}