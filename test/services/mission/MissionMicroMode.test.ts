import { describe, it, expect } from 'vitest';
import { missionInternals } from '@/services/mission/MissionService.js';

describe('mission micro mode helpers', () => {
  it('should activate micro mode when arousal is low', () => {
    const ctx = { arousal: 0.2, emotion: null, tags: [] };
    expect(missionInternals.shouldUseMicroMode(ctx as any)).toBe(true);
  });

  it('should activate when emotion tag matches config', () => {
    const ctx = { arousal: 0.6, emotion: '무기력', tags: [] };
    expect(missionInternals.shouldUseMicroMode(ctx as any)).toBe(true);
  });

  it('isMicroMission returns true for low burden instant mission', () => {
    const mission = {
      code: 'ANY_CODE',
      type: 'instant',
      burden: 1,
    };
    expect(missionInternals.isMicroMission(mission as any)).toBe(true);
  });

  it('isMicroMission returns false for heavy mission', () => {
    const mission = {
      code: 'HARD_TASK',
      type: 'action',
      burden: 5,
    };
    expect(missionInternals.isMicroMission(mission as any)).toBe(false);
  });
});
