import { describe, it, expect, vi } from 'vitest';
import { BaseChatBot } from '@/services/bots/BaseChatBot.js';
import type { LatestAnalysis } from '@/services/bots/BaseChatBot.js';
import type { PlantDbInfo } from '@/interface/index.js';

vi.mock('@/services/bots/RedisChatMessageHistory.js', () => ({
  RedisChatMessageHistory: vi.fn(),
}));

vi.mock('@/config/redis.config.js', () => ({
  default: {
    on: vi.fn(),
  },
}));

class TestBot extends BaseChatBot {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async createPrompt(
    _plantDbInfo: PlantDbInfo,
    _userId: number,
    _plantId: number,
    _userMessage: string,
    _latestAnalysis: LatestAnalysis,
    _analysisContextPlaceholder: string,
  ): Promise<Array<[string, string]>> {
    return [['system', 'hi']];
  }

  public buildAnalysisContextProxy(args: Parameters<any>[0]) {
    return (this as any).buildAnalysisContext(args);
  }
}

describe('BaseChatBot helpers', () => {
  const bot = new TestBot();

  it('buildAnalysisContext는 감정/요인을 문자열로 변환한다', () => {
    const context = bot.buildAnalysisContextProxy({
      plantDbInfo: { userName: '홍길동' },
      latestAnalysis: {
        emotion: '행복',
        factor: '산책',
        message: '좋아',
        createdAt: new Date('2025-01-01T00:00:00Z'),
      },
    });

    expect(context).toContain('감정: 행복');
    expect(context).toContain('요인: 산책');
    expect(context).toContain('관련 발화: "좋아"');
  });

  it('분석 정보가 없으면 기본 메시지를 반환한다', () => {
    const context = bot.buildAnalysisContextProxy({
      plantDbInfo: { userName: '홍길동' },
      latestAnalysis: null,
      history: [],
    });

    expect(context).toContain('홍길동의 감정이 아직 파악되지 않았어요');
  });
});
