import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MultiplayerTicketService } from '@/services/multiplayer/MultiplayerTicketService.js';

const redisMock = vi.hoisted(() => ({
  setex: vi.fn(),
  get: vi.fn(),
  del: vi.fn(),
}));

vi.mock('@/config/redis.config.js', () => ({
  default: redisMock,
}));

describe('MultiplayerTicketService', () => {
  const service = new MultiplayerTicketService();

  beforeEach(() => {
    vi.clearAllMocks();
    redisMock.setex.mockReset();
    redisMock.get.mockReset();
    redisMock.del.mockReset();
  });

  it('멀티플레이 티켓을 생성하고 Redis에 저장한다', async () => {
    const payload = { userId: 1, userName: 'Neo', roomId: 'room-1' };

    const ticket = await service.createTicket(payload);

    expect(ticket).toMatch(/^[\w-]+$/);
    expect(redisMock.setex).toHaveBeenCalledTimes(1);
    const [key, ttl, stored] = redisMock.setex.mock.calls[0];
    expect(key).toBe(`multiplayer_ticket:${ticket}`);
    expect(ttl).toBe(30);
    expect(JSON.parse(stored)).toEqual(payload);
  });

  it('유효한 티켓을 검증하면 payload를 반환하고 키를 삭제한다', async () => {
    const payload = { userId: 9, userName: 'Trinity', roomId: 'zion' };
    redisMock.get.mockResolvedValueOnce(JSON.stringify(payload));

    const result = await service.validateAndConsumeTicket('ticket-1');

    expect(result).toEqual(payload);
    expect(redisMock.del).toHaveBeenCalledWith('multiplayer_ticket:ticket-1');
  });

  it('존재하지 않는 티켓은 null을 반환한다', async () => {
    redisMock.get.mockResolvedValueOnce(null);

    const result = await service.validateAndConsumeTicket('missing');

    expect(result).toBeNull();
    expect(redisMock.del).not.toHaveBeenCalled();
  });
});
