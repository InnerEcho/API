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

  it('ChatBot 응답을 IMessage 형태로 감싼다', async () => {
    const chatBotMock: ChatAgent = {
      processChat: vi.fn().mockResolvedValue('안녕'),
    };
    const router = new AgentRouter({ default: chatBotMock });
    const service = new ChatService(router);

    const result = await service.create(1, 2, 'hello');

    expect(chatBotMock.processChat).toHaveBeenCalledWith(1, 2, 'hello');
    expect(result).toMatchObject({
      userId: 1,
      plantId: 2,
      message: '안녕',
      userType: UserType.BOT,
    });
    expect(result.sendDate).toBeInstanceOf(Date);
  });
});
