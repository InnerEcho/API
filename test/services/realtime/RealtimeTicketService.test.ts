import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RealtimeTicketService } from '@/services/realtime/RealtimeTicketService.js';

const redisMock = vi.hoisted(() => ({
  setex: vi.fn(),
  get: vi.fn(),
  del: vi.fn(),
}));

vi.mock('@/config/redis.config.js', () => ({
  default: redisMock,
}));

describe('RealtimeTicketService', () => {
  const service = new RealtimeTicketService();

  beforeEach(() => {
    vi.clearAllMocks();
    redisMock.setex.mockReset();
    redisMock.get.mockReset();
    redisMock.del.mockReset();
  });

  it('티켓을 생성하고 Redis에 TTL과 함께 저장한다', async () => {
    const userId = 10;
    const plantId = 20;

    const ticket = await service.createTicket(userId, plantId);

    expect(ticket).toMatch(/^[\w-]+$/);
    expect(ticket.length).toBeGreaterThan(0);
    expect(redisMock.setex).toHaveBeenCalledTimes(1);

    const [key, ttl, payload] = redisMock.setex.mock.calls[0];
    expect(key).toBe(`realtime_ticket:${ticket}`);
    expect(ttl).toBe(30);

    const parsed = JSON.parse(payload);
    expect(parsed).toEqual(
      expect.objectContaining({
        userId,
        plantId,
        createdAt: expect.any(Number),
      }),
    );
  });

  it('유효한 티켓은 정보를 반환하고 즉시 삭제된다', async () => {
    const ticket = 'abc';
    const data = { userId: 1, plantId: 2, createdAt: Date.now() };
    redisMock.get.mockResolvedValueOnce(JSON.stringify(data));

    const result = await service.validateAndConsumeTicket(ticket);

    expect(result).toEqual({ userId: 1, plantId: 2 });
    expect(redisMock.del).toHaveBeenCalledWith(`realtime_ticket:${ticket}`);
  });

  it('존재하지 않는 티켓은 null을 반환한다', async () => {
    redisMock.get.mockResolvedValueOnce(null);

    const result = await service.validateAndConsumeTicket('missing');

    expect(result).toBeNull();
    expect(redisMock.del).not.toHaveBeenCalled();
  });

  it('revokeTicket은 해당 키를 삭제한다', async () => {
    await service.revokeTicket('expired');

    expect(redisMock.del).toHaveBeenCalledWith('realtime_ticket:expired');
  });
});
