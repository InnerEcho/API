import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { ChatHistoryService } from '@/services/chat/ChatHistoryService.js';

vi.mock('@/config/redis.config.js', () => ({
  default: {
    get: vi.fn(),
    setex: vi.fn(),
  },
}));

const symbols = vi.hoisted(() => ({
  gte: Symbol('gte'),
  lt: Symbol('lt'),
}));

vi.mock('@/models/index.js', () => {
  const findAll = vi.fn();
  return {
    default: {
      ChatHistory: {
        findAll,
      },
      ChatAnalysis: {},
      Sequelize: {
        Op: {
          gte: symbols.gte,
          lt: symbols.lt,
        },
      },
    },
  };
});

type RedisMock = {
  get: ReturnType<typeof vi.fn>;
  setex: ReturnType<typeof vi.fn>;
};

type DbMock = {
  ChatHistory: { findAll: ReturnType<typeof vi.fn> };
};

let redisMock: RedisMock;
let dbMock: DbMock;
let service: ChatHistoryService;

beforeAll(async () => {
  const redisModule = await import('@/config/redis.config.js');
  redisMock = redisModule.default as RedisMock;

  const dbModule = await import('@/models/index.js');
  dbMock = dbModule.default as DbMock;

  service = new ChatHistoryService();
});

const buildDbRecord = (overrides = {}) => {
  const base = {
    user_id: 1,
    plant_id: 2,
    message: 'hello',
    send_date: new Date('2024-01-01T00:00:00.000Z'),
    user_type: 'User' as const,
    history_id: 42,
    analysis: {
      emotion: 'joy',
      factor: 'sunlight',
    },
  };

  return {
    get: vi.fn().mockReturnValue({ ...base, ...overrides }),
  };
};

describe('ChatHistoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    redisMock.get.mockReset();
    redisMock.setex.mockReset();
    dbMock.ChatHistory.findAll.mockReset();
  });

  it('캐시에 값이 있으면 Redis 데이터를 그대로 반환한다', async () => {
    const cachedPayload = [
      {
        userId: 1,
        plantId: 2,
        message: 'cached',
        sendDate: '2024-01-01T00:00:00.000Z',
        userType: 'User',
        historyId: 5,
        emotion: 'happy',
        factor: 'light',
      },
    ];

    redisMock.get.mockResolvedValueOnce(JSON.stringify(cachedPayload));

    const result = await service.getChatHistory(1, 2);

    expect(result).toEqual(cachedPayload);
    expect(dbMock.ChatHistory.findAll).not.toHaveBeenCalled();
    expect(redisMock.setex).not.toHaveBeenCalled();
  });

  it('캐시 미스 시 DB에서 로드하여 캐싱한다', async () => {
    const record = buildDbRecord();
    redisMock.get.mockResolvedValueOnce(null);
    dbMock.ChatHistory.findAll.mockResolvedValueOnce([record]);
    redisMock.setex.mockResolvedValueOnce(null as unknown as string);

    const result = await service.getChatHistory(1, 2);

    expect(dbMock.ChatHistory.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { user_id: 1, plant_id: 2 },
        order: [['send_date', 'ASC']],
      }),
    );
    expect(result).toEqual([
      {
        userId: 1,
        plantId: 2,
        message: 'hello',
        sendDate: new Date('2024-01-01T00:00:00.000Z'),
        userType: 'User',
        historyId: 42,
        emotion: 'joy',
        factor: 'sunlight',
      },
    ]);
    expect(redisMock.setex).toHaveBeenCalledWith(
      'chat-history:1:2',
      3600,
      JSON.stringify(result),
    );
  });

  it('getChatHistoryFromDb는 캐시를 건너뛰고 DB만 조회한다', async () => {
    const record = buildDbRecord({ history_id: 100 });
    dbMock.ChatHistory.findAll.mockResolvedValueOnce([record]);

    const result = await service.getChatHistoryFromDb(9, 9);

    expect(redisMock.get).not.toHaveBeenCalled();
    expect(redisMock.setex).not.toHaveBeenCalled();
    expect(dbMock.ChatHistory.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { user_id: 9, plant_id: 9 },
      }),
    );
    expect(result[0]?.historyId).toBe(100);
  });

  it('getTodayHistory는 KST 기준 하루 범위를 조회한다', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-11-10T06:00:00.000Z')); // 15:00 KST
    redisMock.get.mockResolvedValueOnce(null);
    dbMock.ChatHistory.findAll.mockResolvedValueOnce([]);
    redisMock.setex.mockResolvedValueOnce(null as unknown as string);

    await service.getTodayHistory(1, 2);

    const callArg = dbMock.ChatHistory.findAll.mock.calls[0][0];
    const sendDate = callArg.where.send_date;
    expect(sendDate[symbols.gte]).toEqual(new Date('2025-11-09T15:00:00.000Z'));
    expect(sendDate[symbols.lt]).toEqual(new Date('2025-11-10T14:59:59.999Z'));
    expect(redisMock.setex).toHaveBeenCalledWith(
      'chat-history:today:1:2:2025-11-10',
      300,
      JSON.stringify([]),
    );
  });
});
