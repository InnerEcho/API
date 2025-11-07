export type PersonaKey =
  | 'A1' | 'A2'
  | 'B1' | 'B2'
  | 'C1' | 'C2'
  | 'D1' | 'D2'
  | 'E1' | 'E2'
  | 'F1' | 'F2';

export type PersonaParams = {
  label: string;
  typeWeights: { instant: number; habit: number; action: number; ar_optional: number };
  arUsedProb: number;
  burdenMean: number;
  timeBucketWeights: { morning: number; afternoon: number; evening: number; night: number };
  noveltyPenchant: number;
  completionProb: number;
  skipProb: number;
};

export const PERSONAS: Record<PersonaKey, PersonaParams> = {
  A1: {
    label: 'Morning-LowBurden-Habit',
    typeWeights: { instant: 0.45, habit: 0.35, action: 0.15, ar_optional: 0.05 },
    arUsedProb: 0.1,
    burdenMean: 1.6,
    timeBucketWeights: { morning: 0.6, afternoon: 0.2, evening: 0.15, night: 0.05 },
    noveltyPenchant: 0.6,
    completionProb: 0.8,
    skipProb: 0.1,
  },
  A2: {
    label: 'Night-HighBurden-ActionAR',
    typeWeights: { instant: 0.05, habit: 0.1, action: 0.55, ar_optional: 0.3 },
    arUsedProb: 0.7,
    burdenMean: 3.8,
    timeBucketWeights: { morning: 0.05, afternoon: 0.15, evening: 0.35, night: 0.45 },
    noveltyPenchant: 0.4,
    completionProb: 0.7,
    skipProb: 0.15,
  },
  B1: {
    label: 'LowBurden-ARShy',
    typeWeights: { instant: 0.35, habit: 0.35, action: 0.2, ar_optional: 0.1 },
    arUsedProb: 0.05,
    burdenMean: 1.8,
    timeBucketWeights: { morning: 0.45, afternoon: 0.25, evening: 0.2, night: 0.1 },
    noveltyPenchant: 0.7,
    completionProb: 0.78,
    skipProb: 0.12,
  },
  B2: {
    label: 'MidHighBurden-ARFan',
    typeWeights: { instant: 0.1, habit: 0.15, action: 0.45, ar_optional: 0.3 },
    arUsedProb: 0.9,
    burdenMean: 3.2,
    timeBucketWeights: { morning: 0.15, afternoon: 0.25, evening: 0.3, night: 0.3 },
    noveltyPenchant: 0.4,
    completionProb: 0.72,
    skipProb: 0.15,
  },
  C1: {
    label: 'Activity-lean',
    typeWeights: { instant: 0.1, habit: 0.15, action: 0.6, ar_optional: 0.15 },
    arUsedProb: 0.4,
    burdenMean: 2.8,
    timeBucketWeights: { morning: 0.2, afternoon: 0.4, evening: 0.3, night: 0.1 },
    noveltyPenchant: 0.4,
    completionProb: 0.7,
    skipProb: 0.18,
  },
  C2: {
    label: 'Calm-lean',
    typeWeights: { instant: 0.4, habit: 0.4, action: 0.1, ar_optional: 0.1 },
    arUsedProb: 0.15,
    burdenMean: 1.7,
    timeBucketWeights: { morning: 0.35, afternoon: 0.35, evening: 0.2, night: 0.1 },
    noveltyPenchant: 0.6,
    completionProb: 0.82,
    skipProb: 0.08,
  },
  D1: {
    label: 'Explorer-Novelty',
    typeWeights: { instant: 0.25, habit: 0.2, action: 0.35, ar_optional: 0.2 },
    arUsedProb: 0.5,
    burdenMean: 2.6,
    timeBucketWeights: { morning: 0.25, afternoon: 0.35, evening: 0.25, night: 0.15 },
    noveltyPenchant: 0.85,
    completionProb: 0.68,
    skipProb: 0.2,
  },
  D2: {
    label: 'Routine-Stable',
    typeWeights: { instant: 0.35, habit: 0.35, action: 0.2, ar_optional: 0.1 },
    arUsedProb: 0.2,
    burdenMean: 2.0,
    timeBucketWeights: { morning: 0.3, afternoon: 0.3, evening: 0.25, night: 0.15 },
    noveltyPenchant: 0.2,
    completionProb: 0.82,
    skipProb: 0.08,
  },
  E1: {
    label: 'Challenger-Completer',
    typeWeights: { instant: 0.1, habit: 0.2, action: 0.5, ar_optional: 0.2 },
    arUsedProb: 0.6,
    burdenMean: 3.5,
    timeBucketWeights: { morning: 0.2, afternoon: 0.3, evening: 0.35, night: 0.15 },
    noveltyPenchant: 0.5,
    completionProb: 0.86,
    skipProb: 0.05,
  },
  E2: {
    label: 'Avoider-HighBurdenSkip',
    typeWeights: { instant: 0.25, habit: 0.2, action: 0.4, ar_optional: 0.15 },
    arUsedProb: 0.25,
    burdenMean: 3.5,
    timeBucketWeights: { morning: 0.2, afternoon: 0.25, evening: 0.25, night: 0.3 },
    noveltyPenchant: 0.3,
    completionProb: 0.42,
    skipProb: 0.4,
  },
  F1: {
    label: 'AR-Light',
    typeWeights: { instant: 0.25, habit: 0.25, action: 0.3, ar_optional: 0.2 },
    arUsedProb: 0.35,
    burdenMean: 2.4,
    timeBucketWeights: { morning: 0.25, afternoon: 0.35, evening: 0.3, night: 0.1 },
    noveltyPenchant: 0.5,
    completionProb: 0.76,
    skipProb: 0.12,
  },
  F2: {
    label: 'AR-Heavy',
    typeWeights: { instant: 0.1, habit: 0.1, action: 0.4, ar_optional: 0.4 },
    arUsedProb: 0.9,
    burdenMean: 2.8,
    timeBucketWeights: { morning: 0.2, afternoon: 0.3, evening: 0.3, night: 0.2 },
    noveltyPenchant: 0.6,
    completionProb: 0.75,
    skipProb: 0.15,
  },
};
