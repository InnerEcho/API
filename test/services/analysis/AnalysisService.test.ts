import { describe, it, expect, beforeEach, vi } from 'vitest';

const axiosModule = vi.hoisted(() => ({
  post: vi.fn(),
}));

vi.mock('axios', () => ({
  default: axiosModule,
}));

const redisCacheModule = vi.hoisted(() => ({
  invalidateHistoryCaches: vi.fn(),
  toHistoryDateKey: vi.fn((value: Date | string) =>
    new Date(value).toISOString().slice(0, 10),
  ),
  buildFullHistoryCacheKey: vi.fn(),
  buildTodayHistoryCacheKey: vi.fn(),
}));

vi.mock('@/services/chat/historyCache.util.js', () => redisCacheModule);

const dbModule = vi.hoisted(() => ({
  ChatAnalysis: {
    findOne: vi.fn(),
    create: vi.fn(),
  },
  ChatHistory: {
    findOne: vi.fn(),
  },
  User: {
    update: vi.fn(),
  },
}));

vi.mock('@/models/index.js', () => ({
  default: dbModule,
}));

import { AnalysisService } from '@/services/analysis/AnalysisService.js';

const mockEmotionResponse = {
  data: {
    predictions: [0.05, 0.05, 0.05, 0.05, 0.05, 0.7, 0.05],
  },
};

const mockFactorResponse = { data: { factor: '햇살' } };

describe('AnalysisService.analyzeAndStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    axiosModule.post.mockReset();
    dbModule.ChatAnalysis.findOne.mockReset();
    dbModule.ChatAnalysis.create.mockReset();
    dbModule.ChatHistory.findOne.mockReset();
    dbModule.User.update.mockReset();
    redisCacheModule.invalidateHistoryCaches.mockReset();
    redisCacheModule.toHistoryDateKey.mockReset();
    redisCacheModule.toHistoryDateKey.mockImplementation(
      (value: Date | string) => new Date(value).toISOString().slice(0, 10),
    );
  });

  it('신규 분석 저장 후 캐시를 무효화한다', async () => {
    dbModule.ChatAnalysis.findOne.mockResolvedValueOnce(null);
    axiosModule.post.mockResolvedValueOnce(mockEmotionResponse);
    axiosModule.post.mockResolvedValueOnce(mockFactorResponse);
    dbModule.ChatAnalysis.create.mockResolvedValueOnce({});
    dbModule.User.update.mockResolvedValueOnce([1]);

    const service = new AnalysisService();
    const sendDate = new Date('2024-01-05T12:00:00Z');

    await service.analyzeAndStore({
      historyId: 101,
      userId: 77,
      message: '안녕',
      plantId: 88,
      sendDate,
    });

    expect(redisCacheModule.invalidateHistoryCaches).toHaveBeenCalledWith(
      77,
      88,
      [
        '2024-01-05',
      ],
    );
  });

  it('plantId가 없으면 history 레코드에서 값을 구해 캐시를 무효화한다', async () => {
    dbModule.ChatAnalysis.findOne.mockResolvedValueOnce(null);
    axiosModule.post.mockResolvedValueOnce(mockEmotionResponse);
    axiosModule.post.mockResolvedValueOnce(mockFactorResponse);
    dbModule.ChatAnalysis.create.mockResolvedValueOnce({});
    dbModule.ChatHistory.findOne.mockResolvedValueOnce({
      get: (field?: string) => {
        const record = {
          plant_id: 55,
          send_date: new Date('2024-02-02T09:00:00Z'),
        };
        if (!field) return record;
        return (record as any)[field];
      },
    });

    const service = new AnalysisService();

    await service.analyzeAndStore({
      historyId: 202,
      userId: 44,
      message: '기분이 좋아',
    });

    expect(dbModule.ChatHistory.findOne).toHaveBeenCalledWith({
      where: { history_id: 202 },
      attributes: ['plant_id', 'send_date', 'user_id'],
    });
    expect(redisCacheModule.invalidateHistoryCaches).toHaveBeenCalledWith(
      44,
      55,
      ['2024-02-02'],
    );
  });
});
