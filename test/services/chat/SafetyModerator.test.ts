import { describe, it, expect } from 'vitest';
import { SafetyModerator } from '@/services/chat/SafetyModerator.js';

const baseInput = {
  userMessage: '요즘 너무 힘들어서 사라지고 싶단 생각이 들어.',
  botDraft: '힘든 마음 나눠줘서 고마워.',
};

describe('SafetyModerator', () => {
  it('JSON 응답을 파싱하고 위험 수준을 정규화한다', async () => {
    const moderator = new SafetyModerator({
      call: async () =>
        JSON.stringify({
          riskLevel: 'HIGH',
          finalResponse: '당신이 느끼는 무게가 정말 크다는 생각이 들어요...',
          actions: ['direct_question', 'share_resources'],
          escalationRequired: true,
        }),
    });

    const result = await moderator.moderate(baseInput);

    expect(result).toEqual({
      riskLevel: 'high',
      finalResponse: '당신이 느끼는 무게가 정말 크다는 생각이 들어요...',
      actions: ['direct_question', 'share_resources'],
      escalationRequired: true,
    });
  });

  it('모호한 위험 레벨을 monitor로 정규화한다', async () => {
    const moderator = new SafetyModerator({
      call: async () =>
        JSON.stringify({
          riskLevel: 'Medium',
          finalResponse: '혹시 스스로를 해치고 싶은 생각이 있었는지 물어봐도 될까요?',
          actions: ['direct_question'],
          escalationRequired: false,
        }),
    });

    const result = await moderator.moderate(baseInput);

    expect(result.riskLevel).toBe('monitor');
    expect(result.actions).toEqual(['direct_question']);
  });

  it('JSON 파싱이 실패하면 초안 응답을 그대로 사용한다', async () => {
    const moderator = new SafetyModerator({
      call: async () => '<<not-json>>',
    });

    const result = await moderator.moderate(baseInput);

    expect(result).toEqual({
      riskLevel: 'none',
      finalResponse: baseInput.botDraft,
      actions: [],
      escalationRequired: false,
    });
  });
});
