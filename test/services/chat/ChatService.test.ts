import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatService } from '@/services/chat/ChatService.js';
import { UserType } from '@/interface/index.js';
import type { ChatAgent } from '@/services/chat/ChatAgent.js';
import { AgentRouter } from '@/services/chat/AgentRouter.js';

vi.mock('@/services/bots/RedisChatMessageHistory.js', () => ({
  RedisChatMessageHistory: vi.fn(),
}));

vi.mock('@/config/redis.config.js', () => ({
  default: {
    on: vi.fn(),
  },
}));

describe('ChatService', () => {
  beforeEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  it('ChatBot 응답을 SafetyModerator로 검토한 뒤 IMessage로 감싼다', async () => {
    const chatBotMock: ChatAgent = {
      processChat: vi.fn().mockResolvedValue('안녕'),
    };
    const router = new AgentRouter({ default: chatBotMock });
    const moderator = {
      moderate: vi.fn().mockResolvedValue({
        finalResponse: '안녕(수정본)',
        riskLevel: 'none',
        actions: [],
        escalationRequired: false,
      }),
    };
    const longTermMemory = {
      retrieveContext: vi.fn().mockResolvedValue([]),
      remember: vi.fn().mockResolvedValue(undefined),
    };
    const service = new ChatService(router, moderator as any, longTermMemory as any);

    const result = await service.create(1, 2, 'hello');

    expect(longTermMemory.retrieveContext).toHaveBeenCalledWith(1, 2, 'hello');
    expect(longTermMemory.remember).not.toHaveBeenCalled(); // message too short
    expect(chatBotMock.processChat).toHaveBeenCalledWith(1, 2, 'hello', undefined);
    expect(moderator.moderate).toHaveBeenCalledWith({
      userMessage: 'hello',
      botDraft: '안녕',
    });
    expect(result).toMatchObject({
      userId: 1,
      plantId: 2,
      message: '안녕(수정본)',
      userType: UserType.BOT,
    });
    expect(result.sendDate).toBeInstanceOf(Date);
  });

  it('긴 사용자 메시지는 장기 기억에 저장한다', async () => {
    const chatBotMock: ChatAgent = {
      processChat: vi.fn().mockResolvedValue('괜찮아 질 거야'),
    };
    const router = new AgentRouter({ default: chatBotMock });
    const moderator = {
      moderate: vi.fn().mockResolvedValue({
        finalResponse: '괜찮아 질 거야',
        riskLevel: 'monitor',
        actions: ['share_resources'],
        escalationRequired: false,
      }),
    };
    const longTermMemory = {
      retrieveContext: vi.fn().mockResolvedValue([]),
      remember: vi.fn().mockResolvedValue(undefined),
    };
    const service = new ChatService(router, moderator as any, longTermMemory as any);

    const distressMessage = '살기 싫고 너무 힘들어 어떻게 해야 할지 모르겠어';

    await service.create(3, 4, distressMessage);

    expect(chatBotMock.processChat).toHaveBeenCalledWith(3, 4, distressMessage, undefined);
    expect(longTermMemory.retrieveContext).toHaveBeenCalled();
    expect(longTermMemory.remember).toHaveBeenCalledWith(3, 4, distressMessage, {
      source: 'user_message',
    });
  });

  it('장기 기억을 옵션으로 전달한다', async () => {
    const chatBotMock: ChatAgent = {
      processChat: vi.fn().mockResolvedValue('응 기억하고 있어'),
    };
    const router = new AgentRouter({ default: chatBotMock });
    const moderator = {
      moderate: vi.fn().mockResolvedValue({
        finalResponse: '응 기억하고 있어',
        riskLevel: 'none',
        actions: [],
        escalationRequired: false,
      }),
    };
    const memorySnippet = [
      { id: '1', content: '지난주에 산책을 즐겼다고 말함', score: 0.82 },
    ];
    const longTermMemory = {
      retrieveContext: vi.fn().mockResolvedValue(memorySnippet),
      remember: vi.fn().mockResolvedValue(undefined),
    };
    const service = new ChatService(router, moderator as any, longTermMemory as any);

    await service.create(5, 6, '오늘도 산책하고 싶어');

    expect(chatBotMock.processChat).toHaveBeenCalledWith(5, 6, '오늘도 산책하고 싶어', {
      longTermMemories: memorySnippet,
    });
  });
});
