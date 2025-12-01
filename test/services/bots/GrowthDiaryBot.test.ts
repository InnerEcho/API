import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GrowthDiaryBot } from '@/services/bots/GrowthDiaryBot.js';

vi.mock('@/services/bots/RedisChatMessageHistory.js', () => ({
  RedisChatMessageHistory: vi.fn(),
}));

vi.mock('@/config/redis.config.js', () => ({
  default: {
    on: vi.fn(),
  },
}));

const chatHistoryMock = {
  getTodayHistory: vi.fn(),
};

vi.mock('@/services/chat/ChatHistoryService.js', () => ({
  ChatHistoryService: vi.fn().mockImplementation(() => chatHistoryMock),
}));

describe('GrowthDiaryBot', () => {
  let bot: GrowthDiaryBot;

  beforeEach(() => {
    vi.clearAllMocks();
    chatHistoryMock.getTodayHistory.mockResolvedValue([
      {
        userType: 'User',
        message: '오늘 너무 피곤해',
        emotion: '슬픔',
        factor: '과제',
      },
      {
        userType: 'BOT',
        message: '괜찮아',
      },
    ]);
    bot = new GrowthDiaryBot();
  });

  it('오늘 대화 기록을 프롬프트에 포함한다', async () => {
    const prompt = await bot.createPrompt(
      { userName: '홍길동', nickname: '금쪽이', speciesName: '몬스테라' },
      1,
      2,
      '안녕',
      null as any,
      '{analysisContext}',
    );

    const systemMessage = prompt[0][1];
    expect(systemMessage).toContain('오늘 대화 내역');
    expect(systemMessage).toContain('사용자: 오늘 너무 피곤해 (감정: 슬픔');
    expect(systemMessage).toContain('- 식물: 괜찮아');
    expect(chatHistoryMock.getTodayHistory).toHaveBeenCalledWith(1, 2);
  });
});
