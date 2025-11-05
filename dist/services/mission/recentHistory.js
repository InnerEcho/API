import db from "../../models/index.js";
import { QueryTypes } from 'sequelize';
const VALID_STATUS_SET = new Set(['assigned', 'complete', 'skipped', 'expired']);
const DEFAULT_STATUSES = ['assigned', 'complete'];
const MAX_DAYS = Number.isFinite(Number(process.env.RECENT_HISTORY_MAX_DAYS)) ? Math.max(1, Number(process.env.RECENT_HISTORY_MAX_DAYS)) : 30;
export async function loadRecentHistoryMap(userId, days = 3, opts) {
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
  if (cnt <= 0) return 0;
  if (cnt === 1) return -0.2;
  if (cnt === 2) return -0.5;
  return -1.0;
}