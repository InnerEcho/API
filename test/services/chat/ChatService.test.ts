import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatService } from '@/services/chat/ChatService.js';
import { UserType } from '@/interface/index.js';
import type { ChatAgent, SafetyPlan } from '@/services/chat/ChatAgent.js';
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

  it('ChatBot 응답을 IMessage 형태로 감싼다', async () => {
    const chatBotMock: ChatAgent = {
      processChat: vi.fn().mockResolvedValue('안녕'),
    };
    const router = new AgentRouter({ default: chatBotMock });
    const safetyGuard = { buildPlan: vi.fn().mockResolvedValue(null) } as any;
    const longTermMemory = {
      retrieveContext: vi.fn().mockResolvedValue([]),
      remember: vi.fn().mockResolvedValue(undefined),
    };
    const service = new ChatService(router, safetyGuard, longTermMemory as any);

    const result = await service.create(1, 2, 'hello');

    expect(safetyGuard.buildPlan).toHaveBeenCalledWith('hello');
    expect(longTermMemory.retrieveContext).toHaveBeenCalledWith(1, 2, 'hello');
    expect(longTermMemory.remember).not.toHaveBeenCalled(); // message too short
    expect(chatBotMock.processChat).toHaveBeenCalledWith(1, 2, 'hello', undefined);
    expect(result).toMatchObject({
      userId: 1,
      plantId: 2,
      message: '안녕',
      userType: UserType.BOT,
    });
    expect(result.sendDate).toBeInstanceOf(Date);
  });

  it('우울감 문장은 safety plan을 전달한다', async () => {
    const chatBotMock: ChatAgent = {
      processChat: vi.fn().mockResolvedValue('괜찮아 질 거야'),
    };
    const router = new AgentRouter({ default: chatBotMock });
    const plan: SafetyPlan = {
      triggerSummary: '우울감 감지',
      reasoningSteps: ['공감', '원인 파악', '안전 안내'],
      finalReminder: '전문가 안내',
    };
    const safetyGuard = {
      buildPlan: vi.fn().mockResolvedValue(plan),
    } as any;
    const longTermMemory = {
      retrieveContext: vi.fn().mockResolvedValue([]),
      remember: vi.fn().mockResolvedValue(undefined),
    };
    const service = new ChatService(router, safetyGuard, longTermMemory as any);

    const distressMessage = '살기 싫고 너무 힘들어 어떻게 해야 할지 모르겠어';

    await service.create(3, 4, distressMessage);

    expect(chatBotMock.processChat).toHaveBeenCalledWith(3, 4, distressMessage, {
      safetyPlan: plan,
    });
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
    const safetyGuard = { buildPlan: vi.fn().mockResolvedValue(null) } as any;
    const memorySnippet = [
      { id: '1', content: '지난주에 산책을 즐겼다고 말함', score: 0.82 },
    ];
    const longTermMemory = {
      retrieveContext: vi.fn().mockResolvedValue(memorySnippet),
      remember: vi.fn().mockResolvedValue(undefined),
    };
    const service = new ChatService(router, safetyGuard, longTermMemory as any);

    await service.create(5, 6, '오늘도 산책하고 싶어');

    expect(chatBotMock.processChat).toHaveBeenCalledWith(5, 6, '오늘도 산책하고 싶어', {
      longTermMemories: memorySnippet,
    });
  });
});
