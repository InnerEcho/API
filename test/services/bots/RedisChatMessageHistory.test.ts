import { describe, it, expect, vi, beforeEach } from 'vitest';

const redisMock = vi.hoisted(() => ({
  lrange: vi.fn(),
  pipeline: vi.fn(),
  del: vi.fn(),
}));

const chatHistoryMock = vi.hoisted(() => ({
  findAll: vi.fn(),
  create: vi.fn(),
  destroy: vi.fn(),
}));

const analysisMock = vi.hoisted(() => ({
  analyzeAndStore: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/config/redis.config.js', () => ({
  default: redisMock,
}));

vi.mock('@/models/index.js', () => ({
  default: {
    ChatHistory: chatHistoryMock,
    ChatAnalysis: {},
  },
}));

vi.mock('@/services/analysis/AnalysisService.js', () => ({
  AnalysisService: vi.fn().mockImplementation(() => analysisMock),
}));

import { RedisChatMessageHistory } from '@/services/bots/RedisChatMessageHistory.js';
import { HumanMessage } from '@langchain/core/messages';

const buildPipeline = () => {
  const api = {
    rpush: vi.fn().mockReturnThis(),
    ltrim: vi.fn().mockReturnThis(),
    expire: vi.fn().mockReturnThis(),
    exec: vi.fn().mockResolvedValue(undefined),
  };
  redisMock.pipeline.mockReturnValueOnce(api as any);
  return api;
};

const buildRecord = (data: Record<string, any>) => {
  return {
    ...data,
    get: (field?: string) => {
      if (!field) {
        return data;
      }
      return data[field];
    },
  };
};

describe('RedisChatMessageHistory', () => {
  const userId = 1;
  const plantId = 2;
  const sessionKey = `chat:${userId}:${plantId}`;

  beforeEach(() => {
    vi.clearAllMocks();
    redisMock.lrange.mockReset();
    redisMock.pipeline.mockReset();
    redisMock.del.mockReset();
    chatHistoryMock.findAll.mockReset();
    chatHistoryMock.create.mockReset();
    chatHistoryMock.destroy.mockReset();
    analysisMock.analyzeAndStore.mockClear();
  });

  it('Redis에 존재하는 메시지를 그대로 반환한다', async () => {
    const cached = [
      JSON.stringify({
        type: 'human',
        content: 'hi',
        analysis: { emotion: 'joy', factor: 'light' },
      }),
    ];
    redisMock.lrange.mockResolvedValueOnce(cached);

    const history = new RedisChatMessageHistory(userId, plantId);
    const messages = await history.getMessages();

    expect(messages).toHaveLength(1);
    expect(messages[0].content).toBe('hi');
    expect(chatHistoryMock.findAll).not.toHaveBeenCalled();
  });

  it('Redis에 없으면 DB에서 로드해 Redis에 채운다', async () => {
    redisMock.lrange.mockResolvedValueOnce([]);
    chatHistoryMock.findAll.mockResolvedValueOnce([
      buildRecord({
        history_id: 1,
        user_type: 'User',
        message: 'Hello',
        analysis: { emotion: null, factor: null },
      }),
      buildRecord({
        history_id: 2,
        user_type: 'Bot',
        message: 'Hi!',
        analysis: null,
      }),
    ]);
    const pipeline = buildPipeline();

    const history = new RedisChatMessageHistory(userId, plantId);
    const messages = await history.getMessages();

    expect(messages).toHaveLength(2);
    expect(messages[0].content).toBe('Hi!');
    expect(messages[1].content).toBe('Hello');
    expect(redisMock.pipeline).toHaveBeenCalledTimes(1);
    expect(pipeline.rpush).toHaveBeenCalledWith(sessionKey, expect.any(String));
    expect(pipeline.ltrim).toHaveBeenCalledWith(sessionKey, -200, -1);
  });

  it('addMessages는 Redis에 push하고 DB를 저장하며 캐시를 무효화한다', async () => {
    const pipeline = buildPipeline();
    chatHistoryMock.create.mockResolvedValueOnce(
      buildRecord({ history_id: 99 }) as any,
    );
    redisMock.del.mockResolvedValue(1);

    const history = new RedisChatMessageHistory(userId, plantId);
    await history.addUserMessage('latest');

    expect(pipeline.rpush).toHaveBeenCalledWith(
      sessionKey,
      expect.any(String),
    );
    expect(chatHistoryMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: userId,
        plant_id: plantId,
        message: 'latest',
      }),
    );
    expect(redisMock.del).toHaveBeenCalledWith(
      `chat-history:${userId}:${plantId}`,
      expect.stringMatching(`chat-history:today:${userId}:${plantId}`),
    );
    expect(analysisMock.analyzeAndStore).toHaveBeenCalledWith(
      expect.objectContaining({
        historyId: 99,
        message: 'latest',
      }),
    );
  });

  it('clear는 Redis와 DB 기록을 삭제한다', async () => {
    redisMock.del.mockResolvedValue(1);
    chatHistoryMock.destroy.mockResolvedValue(1 as any);

    const history = new RedisChatMessageHistory(userId, plantId);
    await history.clear();

    expect(redisMock.del).toHaveBeenCalledWith(sessionKey);
    expect(chatHistoryMock.destroy).toHaveBeenCalledWith({
      where: { user_id: userId, plant_id: plantId },
    });
  });

  it('mapHistoriesToMessages는 HumanMessage 추가 정보를 유지한다', async () => {
    const history = new RedisChatMessageHistory(userId, plantId);
    const messages = (history as any).mapHistoriesToMessages([
      buildRecord({
        history_id: 7,
        user_type: 'User',
        message: 'ask',
        analysis: { emotion: 'happy', factor: 'sun' },
      }),
    ]);

    expect(messages[0]).toBeInstanceOf(HumanMessage);
    expect(messages[0].additional_kwargs?.analysis).toEqual({
      historyId: 7,
      emotion: 'happy',
      factor: 'sun',
    });
  });
});
