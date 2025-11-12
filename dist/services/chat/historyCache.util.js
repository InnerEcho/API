import redisClient from "../../config/redis.config.js";
const FULL_HISTORY_PREFIX = 'chat-history';
const TODAY_HISTORY_PREFIX = 'chat-history:today';
export function toHistoryDateKey(date) {
  const reference = new Date(date);
  if (Number.isNaN(reference.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }
  return reference.toISOString().slice(0, 10);
}
export const buildFullHistoryCacheKey = (userId, plantId) => `${FULL_HISTORY_PREFIX}:${userId}:${plantId}`;
export const buildTodayHistoryCacheKey = (userId, plantId, date) => `${TODAY_HISTORY_PREFIX}:${userId}:${plantId}:${date}`;

/**
 * Redis JSON 캐시 키를 무효화한다.
 */
export async function invalidateHistoryCaches(userId, plantId, dates = []) {
  const keys = [buildFullHistoryCacheKey(userId, plantId)];
  dates.forEach(date => {
    if (date) {
      keys.push(buildTodayHistoryCacheKey(userId, plantId, date));
    }
  });
  const uniqueKeys = [...new Set(keys)];
  try {
    await redisClient.del(...uniqueKeys);
  } catch (error) {
    console.error('Failed to invalidate chat history caches', error);
  }
}