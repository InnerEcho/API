import { describe, it, expect, vi } from 'vitest';
import { ChatService } from '@/services/chat/ChatService.js';
import { UserType } from '@/interface/index.js';

vi.mock('@/services/bots/RedisChatMessageHistory.js', () => ({
  RedisChatMessageHistory: vi.fn(),
}));

vi.mock('@/config/redis.config.js', () => ({
  default: {
    on: vi.fn(),
  },
}));

describe('ChatService', () => {
  it('ChatBot 응답을 IMessage 형태로 감싼다', async () => {
    const chatBotMock = {
      processChat: vi.fn().mockResolvedValue('안녕'),
    };
    const service = new ChatService(chatBotMock as any);

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
