import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GrowthDiaryService } from '@/services/growthDiary/GrowthDiaryService.js';
import { UserType } from '@/interface/index.js';
import type { IMessage } from '@/interface/index.js';

const chatHistoryMock = vi.hoisted(() => ({
  getTodayHistory: vi.fn(),
}));

vi.mock('@/config/redis.config.js', () => ({
  default: {
    on: vi.fn(),
    pipeline: vi.fn().mockReturnValue({
      rpush: vi.fn().mockReturnThis(),
      ltrim: vi.fn().mockReturnThis(),
      expire: vi.fn().mockReturnThis(),
      exec: vi.fn(),
    }),
    get: vi.fn(),
    setex: vi.fn(),
    del: vi.fn(),
  },
}));

vi.mock('@/services/chat/ChatHistoryService.js', () => ({
  ChatHistoryService: vi.fn().mockImplementation(() => chatHistoryMock),
}));

const userMissionFindOne = vi.hoisted(() => vi.fn());
const sequelizeStub = vi.hoisted(() => ({
  where: vi.fn((...args: any[]) => ({ __where: args })),
  fn: vi.fn(),
  col: vi.fn((column: string) => column),
}));

vi.mock('@/models/index.js', () => ({
  default: {
    UserMission: {
      findOne: userMissionFindOne,
    },
    Mission: {},
    Sequelize: sequelizeStub,
  },
}));

describe('GrowthDiaryService helpers', () => {
  const buildHistory = (overrides: Partial<IMessage>): IMessage => ({
    userId: 1,
    plantId: 1,
    message: 'hi',
    sendDate: new Date(),
    userType: UserType.USER,
    historyId: 1,
    ...overrides,
  });

  let service: GrowthDiaryService;

  beforeEach(() => {
    vi.clearAllMocks();
    chatHistoryMock.getTodayHistory.mockReset();
    userMissionFindOne.mockReset();
    sequelizeStub.where.mockReset();
    sequelizeStub.fn.mockReset();
    sequelizeStub.col.mockReset();
    service = new GrowthDiaryService({} as any);
  });

  it('대표 감정이 없으면 null을 반환한다', () => {
    const history = [
      buildHistory({ emotion: '중립', factor: '이유', sendDate: new Date('2025-01-01T09:00:00Z') }),
    ];

    const result = (service as any).getDominantEmotionFromHistory(history);

    expect(result).toEqual({ emotion: null, factor: null });
  });

  it('행복이 다른 감정과 동률일 때 행복을 선택한다', () => {
    const history: IMessage[] = [
      buildHistory({ emotion: '행복', factor: '산책', sendDate: new Date('2025-01-01T09:00:00Z') }),
      buildHistory({ emotion: '슬픔', factor: '피곤', sendDate: new Date('2025-01-01T10:00:00Z') }),
      buildHistory({ emotion: '행복', factor: '커피', sendDate: new Date('2025-01-01T11:00:00Z') }),
      buildHistory({ emotion: '슬픔', factor: '과로', sendDate: new Date('2025-01-01T12:00:00Z') }),
    ];

    const result = (service as any).getDominantEmotionFromHistory(history);

    expect(result).toEqual({ emotion: '행복', factor: '커피' });
  });

  it('동률이면서 행복이 없으면 가장 최근 감정을 선택한다', () => {
    const history: IMessage[] = [
      buildHistory({ emotion: '분노', factor: '갈등', sendDate: new Date('2025-01-01T09:00:00Z') }),
      buildHistory({ emotion: '슬픔', factor: '실패', sendDate: new Date('2025-01-01T11:00:00Z') }),
      buildHistory({ emotion: '슬픔', factor: '실패2', sendDate: new Date('2025-01-01T12:00:00Z') }),
      buildHistory({ emotion: '분노', factor: '갈등2', sendDate: new Date('2025-01-01T13:00:00Z') }),
    ];

    const result = (service as any).getDominantEmotionFromHistory(history);

    expect(result).toEqual({ emotion: '분노', factor: '갈등2' });
  });

  it('대표 미션은 가장 먼저 완료한 미션 제목을 반환한다', async () => {
    const mission = { title: '스트레칭 30초', code: 'STRETCH' };
    userMissionFindOne.mockResolvedValueOnce({
      get: (field?: string) => {
        if (field === 'mission') {
          return mission;
        }
        return undefined;
      },
    });

    const primaryMission = await (service as any).findPrimaryMission(10, '2025-11-09');

    expect(userMissionFindOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          user_id: 10,
          status: 'complete',
        }),
      }),
    );
    expect(primaryMission).toBe('스트레칭 30초');
  });

  it('대표 미션이 없으면 null을 반환한다', async () => {
    userMissionFindOne.mockResolvedValueOnce(null);

    const primaryMission = await (service as any).findPrimaryMission(20, '2025-11-09');

    expect(primaryMission).toBeNull();
  });

  it('메타 데이터가 없으면 "없음"으로 치환한다', () => {
    const base = {
      diaryId: 1,
      dominantEmotion: null,
      emotionFactor: undefined,
      primaryMission: null,
    };

    const normalized = (service as any).applyDiaryMetaFallback(base);

    expect(normalized).toEqual({
      diaryId: 1,
      dominantEmotion: '없음',
      emotionFactor: '없음',
      primaryMission: '없음',
    });
  });
});
