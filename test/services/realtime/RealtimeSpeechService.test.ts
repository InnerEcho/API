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

  let service: RealtimeSpeechService;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = 'test-key';
    service = new RealtimeSpeechService(
      plantRepoMock as any,
      promptBuilderMock as any,
      realtimeClientMock as any,
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

  it('saveChatHistory는 Redis 히스토리에 메시지를 저장한다', async () => {
    await service.saveChatHistory(1, 2, 'hi', 'hello');

    expect(redisHistoryMock.addUserMessage).toHaveBeenCalledWith('hi');
    expect(redisHistoryMock.addAIChatMessage).toHaveBeenCalledWith('hello');
  });
});
