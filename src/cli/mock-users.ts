import 'dotenv/config';
import bcrypt from 'bcryptjs';
import db from '@/models/index.js';
import { QueryTypes } from 'sequelize';
import { PERSONAS, type PersonaKey, type PersonaParams } from './personas.js';

type Opts = {
  total: number;
  perPersona?: number;
  days: number;
  seed: number;
  personas: PersonaKey[];
  createUsers: boolean;
  userPrefix: string;
};

const DEFAULT_PERSONAS = Object.keys(PERSONAS) as PersonaKey[];

function isPersonaKey(value: string): value is PersonaKey {
  return value in PERSONAS;
}

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

  const personasRaw = (map.get('personas') ?? DEFAULT_PERSONAS.join(','))
    .split(',')
    .map(s => s.trim().toUpperCase())
    .filter(Boolean);

  const personas = personasRaw.filter(isPersonaKey);
  if (!personas.length) personas.push(...DEFAULT_PERSONAS);

  const strToBool = (value: string | undefined, fallback: boolean) => {
    if (value === undefined) return fallback;
    const lowered = value.toLowerCase();
    if (['false', '0', 'no', 'off'].includes(lowered)) return false;
    if (['true', '1', 'yes', 'on'].includes(lowered)) return true;
    return fallback;
  };

  const parseNum = (value: string | undefined, fallback: number) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };

  const rawPerPersona = map.has('perPersona') ? parseNum(map.get('perPersona'), NaN) : undefined;
  const perPersona = rawPerPersona && rawPerPersona > 0 ? rawPerPersona : undefined;

  let total = Math.max(1, parseNum(map.get('total'), 48));
  if (perPersona) {
    total = perPersona * personas.length;
  }

  return {
    total,
    perPersona,
    days: Math.max(1, parseNum(map.get('days'), 14)),
    seed: parseNum(map.get('seed'), 42),
    personas,
    createUsers: strToBool(map.get('createUsers'), true),
    userPrefix: map.get('userPrefix') ?? 'mock',
  };
}

// ---------- RNG (deterministic) ----------
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

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function normalLike(rng: () => number, mean: number, sd = 0.7) {
  // Box–Muller transform to approximate a normal distribution
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + z * sd;
}

// ---------- time helpers (KST→UTC) ----------
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

const HASHED_PASSWORD = bcrypt.hashSync('mock1234!', 8);

async function ensureMockUsers(
  prefix: string,
  count: number,
  personas: PersonaKey[],
  rng: () => number,
  perPersona?: number,
) {
  const created: { user_id: number; persona: PersonaKey }[] = [];

  const assignments: PersonaKey[] = [];
  if (perPersona && perPersona > 0) {
    for (const persona of personas) {
      for (let i = 0; i < perPersona; i++) {
        assignments.push(persona);
      }
    }
  } else {
    while (assignments.length < count) {
      for (const persona of personas) {
        assignments.push(persona);
        if (assignments.length === count) break;
      }
    }
  }

  let idx = 1;
  for (const persona of assignments) {
    const padded = String(idx).padStart(3, '0');
    const email = `${prefix}+${persona.toLowerCase()}_${padded}@example.com`;
    const name = `${prefix}_${persona}_${padded}`;
    await db.sequelize.query(
      `INSERT INTO \`user\` (user_email, user_name, password, user_gender, created_at)
       VALUES (:email, :name, :password, :gender, NOW())
       ON DUPLICATE KEY UPDATE user_name = VALUES(user_name)`,
      {
        replacements: {
          email,
          name,
          password: HASHED_PASSWORD,
          gender: rng() < 0.5 ? 'NONE' : 'OTHR',
        },
        type: QueryTypes.INSERT,
      },
    );

    const [row] = await db.sequelize.query<{ user_id: number }[]>(
      `SELECT user_id FROM \`user\` WHERE user_email = :email LIMIT 1`,
      { replacements: { email }, type: QueryTypes.SELECT },
    );

    if (row?.user_id) {
      created.push({ user_id: Number(row.user_id), persona });
    }
    idx++;
  }

  return created.slice(0, count);
}

type MissionRow = { mission_id: number; code: string; type: 'instant' | 'habit' | 'action' | 'ar_optional'; burden: number };

async function loadMissionPool(): Promise<MissionRow[]> {
  const rows = await db.sequelize.query<MissionRow[]>(
    `SELECT mission_id, code, type, burden
     FROM missions
     WHERE is_active = 1`,
    { type: QueryTypes.SELECT },
  );

  return rows.map(row => ({
    mission_id: Number((row as any).mission_id),
    code: (row as any).code,
    type: (row as any).type,
    burden: Number((row as any).burden),
  }));
}

function sampleMission(rng: () => number, pool: MissionRow[], persona: PersonaParams, lastCode?: string) {
  const types: MissionRow['type'][] = ['instant', 'habit', 'action', 'ar_optional'];
  const weights = types.map(t => persona.typeWeights[t]);
  const chosenType = pickWeighted(rng, types, weights);

  let candidates = pool.filter(m => m.type === chosenType);

  const desiredBurden = clamp(Math.round(normalLike(rng, persona.burdenMean, 0.7)), 1, 5);
  candidates = candidates.sort(
    (a, b) => Math.abs(a.burden - desiredBurden) - Math.abs(b.burden - desiredBurden),
  );

  if (
    persona.noveltyPenchant > 0.5 &&
    lastCode &&
    candidates.length > 1 &&
    rng() < persona.noveltyPenchant
  ) {
    const noRepeat = candidates.filter(m => m.code !== lastCode);
    if (noRepeat.length) candidates = noRepeat;
  }

  if (!candidates.length) {
    return pool[Math.floor(rng() * pool.length)];
  }

  return candidates[0];
}

async function loadExistingMockUsers(
  prefix: string,
  limit: number,
  personas: PersonaKey[],
  rng: () => number,
) {
  const likePattern = `${prefix}%`;
  const rows = await db.sequelize.query<{ user_id: number; user_email: string }[]>(
    `SELECT user_id, user_email FROM \`user\`
     WHERE user_email LIKE :likePattern
     ORDER BY user_id
     LIMIT ${Math.max(0, limit)}`,
    { replacements: { likePattern }, type: QueryTypes.SELECT },
  );

  const fallback = () => personas[Math.floor(rng() * personas.length)];

  return rows.map(row => {
    const match = row.user_email.match(/\+([a-z0-9]+)_/i);
    const key = match?.[1]?.toUpperCase() ?? '';
    const persona = (isPersonaKey(key) ? key : fallback()) as PersonaKey;
    return { user_id: Number(row.user_id), persona };
  });
}

async function main() {
  const opts = parseArgs();
  const rng = mulberry32(opts.seed);

  const pool = await loadMissionPool();
  if (!pool.length) {
    console.error('No missions found. Seed missions first.');
    process.exit(1);
  }

  let users: { user_id: number; persona: PersonaKey }[];
  if (opts.createUsers) {
    users = await ensureMockUsers(opts.userPrefix, opts.total, opts.personas, rng, opts.perPersona);
  } else {
    users = await loadExistingMockUsers(opts.userPrefix, opts.total, opts.personas, rng);
  }

  if (!users.length) {
    console.error('No users to mock.');
    process.exit(1);
  }

  console.log(`Mocking ${users.length} users over last ${opts.days} days...`);

  const personaMap: Record<PersonaKey, PersonaParams> = PERSONAS;

  for (const user of users) {
    const persona = personaMap[user.persona];
    if (!persona) continue;

    let lastCode: string | undefined;

    for (let day = opts.days - 1; day >= 0; day--) {
      const roll = rng();
      const dailyCount = roll < 0.15 ? 0 : 1 + Math.floor(rng() * 3);
      if (dailyCount === 0) continue;

      for (let k = 0; k < dailyCount; k++) {
        const buckets: Array<'morning' | 'afternoon' | 'evening' | 'night'> = [
          'morning',
          'afternoon',
          'evening',
          'night',
        ];
        const chosenBucket = pickWeighted(
          rng,
          buckets,
          buckets.map(bucket => persona.timeBucketWeights[bucket]),
        );

        const hour = hourFromBucket(rng, chosenBucket);
        const assignedAt = kstDate(day, hour, Math.floor(rng() * 50));
        const expiresAt = kstDate(day + 1, 3);

        const mission = sampleMission(rng, pool, persona, lastCode);
        lastCode = mission.code;

        await db.sequelize.query(
          `INSERT INTO user_missions (
             user_id, mission_id, status, assigned_at, expires_at, evidence, created_at, updated_at
           )
           VALUES (:userId, :missionId, 'assigned', :assignedAt, :expiresAt, NULL, :createdAt, :updatedAt)
           ON DUPLICATE KEY UPDATE
             expires_at = VALUES(expires_at),
             updated_at = VALUES(updated_at)`,
          {
            replacements: {
              userId: user.user_id,
              missionId: mission.mission_id,
              assignedAt,
              expiresAt,
              createdAt: assignedAt,
              updatedAt: assignedAt,
            },
            type: QueryTypes.INSERT,
          },
        );

        const outcomeRoll = rng();
        if (outcomeRoll < persona.completionProb) {
          const arUsed = rng() < persona.arUsedProb;
          const completedAt = kstDate(day, hour, 5 + Math.floor(rng() * 40));
          await db.sequelize.query(
            `UPDATE user_missions
             SET status = 'complete',
                 completed_at = :completedAt,
                 evidence = JSON_OBJECT('arUsed', :arUsed),
                 updated_at = NOW()
             WHERE user_id = :userId AND mission_id = :missionId AND assigned_at = :assignedAt`,
            {
              replacements: {
                userId: user.user_id,
                missionId: mission.mission_id,
                assignedAt,
                completedAt,
                arUsed: arUsed ? 1 : 0,
              },
              type: QueryTypes.UPDATE,
            },
          );
        } else if (outcomeRoll < persona.completionProb + persona.skipProb) {
          await db.sequelize.query(
            `UPDATE user_missions
             SET status = 'skipped',
                 updated_at = NOW()
             WHERE user_id = :userId AND mission_id = :missionId AND assigned_at = :assignedAt`,
            {
              replacements: {
                userId: user.user_id,
                missionId: mission.mission_id,
                assignedAt,
              },
              type: QueryTypes.UPDATE,
            },
          );
        }
      }
    }
  }

  console.log('✅ Mock generation done.');
  await db.sequelize.close();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
