type FriendRecoConfig = {
  days: number;
  minSamples: number;
  burdenTolerance: number;
  arLaplace: number;
  defaultTopN: number;
};

let cached: FriendRecoConfig | null = null;

function readNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === null || raw === '') return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

export function getFriendRecoConfig(): FriendRecoConfig {
  if (cached) return cached;

  cached = {
    days: Math.max(1, Math.floor(readNumber('FRIENDS_DAYS', 14))),
    minSamples: Math.max(1, Math.floor(readNumber('FRIENDS_MIN_SAMPLES', 3))),
    burdenTolerance: Math.max(0, readNumber('FRIENDS_BURDEN_TOL', 0.6)),
    arLaplace: Math.min(1, Math.max(0, readNumber('FRIENDS_AR_LAPLACE', 0.2))),
    defaultTopN: Math.max(1, Math.floor(readNumber('FRIENDS_DEFAULT_TOP_N', 10))),
  };

  return cached;
}
