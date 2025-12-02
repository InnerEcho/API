import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RealtimeSpeechService } from '@/services/realtime/RealtimeSpeechService.js';

const redisHistoryMock = vi.hoisted(() => ({
  addUserMessage: vi.fn(),
  addAIChatMessage: vi.fn(),
  getMessages: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/services/bots/RedisChatMessageHistory.js', () => ({
  RedisChatMessageHistory: vi.fn().mockImplementation(() => redisHistoryMock),
}));

describe('RealtimeSpeechService', () => {
  const plantRepoMock = {
    getPlantInfo: vi.fn(),
  };
  const promptBuilderMock = {
    buildSystemPrompt: vi.fn(),
  };
  const realtimeClientMock = {
    createSession: vi.fn(),
  };
  const safetyGuardMock = {
    buildPlan: vi.fn(),
  };
  const longTermMemoryMock = {
    retrieveContext: vi.fn(),
  };

  let service: RealtimeSpeechService;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = 'test-key';
    safetyGuardMock.buildPlan.mockResolvedValue(null);
    longTermMemoryMock.retrieveContext.mockResolvedValue([]);
    service = new RealtimeSpeechService(
      plantRepoMock as any,
      promptBuilderMock as any,
      realtimeClientMock as any,
      safetyGuardMock as any,
      longTermMemoryMock as any,
    );
  });

  it('createWebRTCSession은 식물 정보와 프롬프트를 이용해 세션을 생성한다', async () => {
    plantRepoMock.getPlantInfo.mockResolvedValue({
      nickname: '금쪽이',
      speciesName: '몬스테라',
      userName: '홍길동',
    });
    promptBuilderMock.buildSystemPrompt.mockReturnValue('prompt');
    realtimeClientMock.createSession.mockResolvedValue({
      ephemeralToken: 'token',
      expiresAt: 123,
      sessionId: 'sess',
      model: 'model',
      voice: 'voice',
    });

    const result = await service.createWebRTCSession(1, 2);

    expect(plantRepoMock.getPlantInfo).toHaveBeenCalledWith(1, 2);
    expect(promptBuilderMock.buildSystemPrompt).toHaveBeenCalled();
    expect(realtimeClientMock.createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        instructions: 'prompt',
      }),
    );
    expect(result).toEqual({
      ephemeralToken: 'token',
      expiresAt: 123,
      sessionId: 'sess',
    });
  });

  it('initialMessage가 있으면 안전 계획과 기억을 지시문에 포함한다', async () => {
    plantRepoMock.getPlantInfo.mockResolvedValue({
      nickname: '금쪽이',
      speciesName: '몬스테라',
      userName: '홍길동',
    });
    promptBuilderMock.buildSystemPrompt.mockReturnValue('base');
    safetyGuardMock.buildPlan.mockResolvedValue({
      triggerSummary: '위험 감지',
      reasoningSteps: ['공감', '안내'],
      finalReminder: '전문가에게 안내',
    });
    longTermMemoryMock.retrieveContext.mockResolvedValue([
      { id: '1', content: '지난주에 산책하고 싶다고 말함', score: 0.8 },
    ]);
    realtimeClientMock.createSession.mockResolvedValue({
      ephemeralToken: 'token',
      expiresAt: 123,
      sessionId: 'sess',
      model: 'model',
      voice: 'voice',
    });

    await service.createWebRTCSession(1, 2, '오늘 너무 힘들어');

    expect(safetyGuardMock.buildPlan).toHaveBeenCalledWith('오늘 너무 힘들어');
    expect(longTermMemoryMock.retrieveContext).toHaveBeenCalledWith(
      1,
      2,
      '오늘 너무 힘들어',
    );
    const instructions = realtimeClientMock.createSession.mock.calls[0][0].instructions;
    expect(instructions).toContain('base');
    expect(instructions).toContain('장기 기억');
    expect(instructions).toContain('안전 대응 지침');
  });

  it('saveChatHistory는 Redis 히스토리에 메시지를 저장한다', async () => {
    await service.saveChatHistory(1, 2, 'hi', 'hello');

    expect(redisHistoryMock.addUserMessage).toHaveBeenCalledWith('hi');
    expect(redisHistoryMock.addAIChatMessage).toHaveBeenCalledWith('hello');
  });
});
