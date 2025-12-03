import { describe, it, expect, beforeEach } from 'vitest';
import { DepressionSafetyGuard } from '@/services/chat/DepressionSafetyGuard.js';

describe('DepressionSafetyGuard', () => {
  beforeEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  it('우울감 키워드를 감지하면 safety plan을 생성한다', async () => {
    const guard = new DepressionSafetyGuard();

    const plan = await guard.buildPlan('요즘 너무 우울하고 그냥 끝내고 싶어');

    expect(plan).not.toBeNull();
    expect(plan?.reasoningSteps).toHaveLength(3);
    expect(plan?.triggerSummary).toContain('우울감');
  });

  it('중립적 문장은 plan을 생성하지 않는다', async () => {
    const guard = new DepressionSafetyGuard();

    const plan = await guard.buildPlan('오늘은 날씨가 참 좋네');

    expect(plan).toBeNull();
  });
});
