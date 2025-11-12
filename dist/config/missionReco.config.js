import fs from 'node:fs';
import path from 'node:path';
const defaultConfig = {
  candidateFilter: {
    maxBurden: 2
  },
  softScore: {
    jitter: 0.02,
    byBucket: {
      morning: {
        LIGHT_CHECK: 1.5,
        DRINK_WATER_250ML: 1.2,
        CHECK_HOME_PLANT: 0.8,
        TAKE_A_BREATH_10S: 1
      },
      afternoon: {
        MARCH_IN_PLACE_3MIN: 0.6,
        MARCH_IN_PLACE_1MIN: 0.8,
        STRETCH_30S: 1.1,
        LOOK_OUT_WINDOW_30S: 0.6
      },
      evening: {
        TAKE_A_BREATH_10S: 1.2,
        ONE_LINE_JOURNAL: 1.2,
        CHAT_WITH_PLANT: 0.8
      },
      night: {
        TAKE_A_BREATH_10S: 1.3,
        ONE_LINE_JOURNAL: 1.4,
        LOOK_OUT_WINDOW_30S: 0.8,
        DRINK_WATER_250ML: 0.5
      }
    },
    typeAdjustments: {
      ar_optional: -0.1
    }
  },
  context: {
    lowArousal: {
      threshold: 0.3,
      minBurden: 3,
      penalty: 1
    },
    emotionBoosts: [{
      tags: ['무기력', 'lethargic', '귀찮음'],
      boost: 1,
      conditions: [{
        codeIncludes: ['BREATH']
      }, {
        types: ['instant']
      }]
    }, {
      tags: ['초조', 'anxious'],
      boost: 1,
      conditions: [{
        codeIncludes: ['TAKE_A_BREATH']
      }, {
        types: ['habit']
      }]
    }, {
      tags: ['피곤', 'tired', '피로'],
      boost: 0.8,
      conditions: [{
        types: ['instant', 'habit']
      }, {
        codes: ['LOOK_OUT_WINDOW_30S']
      }]
    }, {
      tags: ['행복', '기쁨', 'happy'],
      boost: 0.6,
      conditions: [{
        types: ['ar_optional', 'action']
      }]
    }]
  },
  novelty: {
    penaltiesByCount: [0, -0.3, -0.6, -1],
    historyDays: 3,
    statuses: ['assigned', 'complete']
  }
};
let cachedConfig = null;
function safeJsonParse(input, label) {
  try {
    return JSON.parse(input);
  } catch (error) {
    console.warn(`[missionReco.config] Failed to parse ${label}: ${error.message}`);
    return null;
  }
}
function mergeDeep(target, source) {
  if (source === undefined || source === null) {
    return target;
  }
  if (Array.isArray(target) && Array.isArray(source)) {
    return source.slice();
  }
  if (typeof target === 'object' && typeof source === 'object') {
    const result = {
      ...target
    };
    for (const key of Object.keys(source)) {
      const value = source[key];
      if (value === undefined) continue;
      if (key in target) {
        result[key] = mergeDeep(target[key], value);
      } else {
        result[key] = value;
      }
    }
    return result;
  }
  return source;
}
function loadOverrideFromPath() {
  const overridePath = process.env.RECO_CONFIG_PATH;
  if (!overridePath) return null;
  const resolved = path.isAbsolute(overridePath) ? overridePath : path.resolve(process.cwd(), overridePath);
  if (!fs.existsSync(resolved)) {
    console.warn(`[missionReco.config] RECO_CONFIG_PATH file not found: ${resolved}`);
    return null;
  }
  try {
    const raw = fs.readFileSync(resolved, 'utf-8');
    return safeJsonParse(raw, `RECO_CONFIG_PATH (${resolved})`);
  } catch (error) {
    console.warn(`[missionReco.config] Failed to read RECO_CONFIG_PATH: ${error.message}`);
    return null;
  }
}
function loadOverrideFromEnv() {
  const raw = process.env.RECO_CONFIG_JSON;
  if (!raw) return null;
  return safeJsonParse(raw, 'RECO_CONFIG_JSON');
}
function applyScalarEnvOverrides(config) {
  const cloned = mergeDeep({}, config);
  const maxBurdenEnv = process.env.RECO_BURDEN_MAX;
  if (maxBurdenEnv !== undefined) {
    const normalized = maxBurdenEnv.trim().toLowerCase();
    if (normalized === 'null' || normalized === 'none') {
      cloned.candidateFilter.maxBurden = null;
    } else {
      const value = Number(maxBurdenEnv);
      if (Number.isFinite(value)) {
        cloned.candidateFilter.maxBurden = value;
      }
    }
  }
  const jitterEnv = process.env.RECO_SOFT_JITTER;
  if (jitterEnv !== undefined) {
    const value = Number(jitterEnv);
    if (Number.isFinite(value)) {
      cloned.softScore.jitter = Math.max(0, value);
    }
  }
  const arPenaltyEnv = process.env.RECO_AR_OPTIONAL_PENALTY;
  if (arPenaltyEnv !== undefined) {
    const value = Number(arPenaltyEnv);
    if (Number.isFinite(value)) {
      cloned.softScore.typeAdjustments.ar_optional = value;
    }
  }
  const noveltyDaysEnv = process.env.RECO_NOVELTY_HISTORY_DAYS;
  if (noveltyDaysEnv !== undefined) {
    const value = Number(noveltyDaysEnv);
    if (Number.isFinite(value) && value >= 1) {
      cloned.novelty.historyDays = Math.floor(value);
    }
  }
  const noveltyPenaltiesEnv = process.env.RECO_NOVELTY_PENALTIES;
  if (noveltyPenaltiesEnv) {
    const numbers = noveltyPenaltiesEnv.split(',').map(v => Number(v.trim())).filter(v => Number.isFinite(v));
    if (numbers.length >= 1) {
      cloned.novelty.penaltiesByCount = numbers;
    }
  }
  return cloned;
}
export function getMissionRecoConfig() {
  if (cachedConfig) {
    return cachedConfig;
  }
  let merged = mergeDeep({}, defaultConfig);
  const fileOverride = loadOverrideFromPath();
  if (fileOverride) {
    merged = mergeDeep(merged, fileOverride);
  }
  const envOverride = loadOverrideFromEnv();
  if (envOverride) {
    merged = mergeDeep(merged, envOverride);
  }
  merged = applyScalarEnvOverrides(merged);
  cachedConfig = merged;
  return merged;
}