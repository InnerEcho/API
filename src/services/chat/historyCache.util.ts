import redisClient from '@/config/redis.config.js';

const FULL_HISTORY_PREFIX = 'chat-history';
const TODAY_HISTORY_PREFIX = 'chat-history:today';

export const buildFullHistoryCacheKey = (userId: number, plantId: number) =>
  `${FULL_HISTORY_PREFIX}:${userId}:${plantId}`;

export const buildTodayHistoryCacheKey = (
  userId: number,
  plantId: number,
  date: string,
) => `${TODAY_HISTORY_PREFIX}:${userId}:${plantId}:${date}`;

/**
 * Redis JSON 캐시 키를 무효화한다.
 */
export async function invalidateHistoryCaches(
  userId: number,
  plantId: number,
  dates: string[] = [],
): Promise<void> {
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
