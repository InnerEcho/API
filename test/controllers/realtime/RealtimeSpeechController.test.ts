import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Request, Response } from 'express';
import { RealtimeSpeechController } from '@/controllers/realtime/RealtimeSpeechController.js';

vi.mock('@/config/redis.config.js', () => ({
  default: {
    on: vi.fn(),
    pipeline: vi.fn().mockReturnValue({
      rpush: vi.fn().mockReturnThis(),
      ltrim: vi.fn().mockReturnThis(),
      expire: vi.fn().mockReturnThis(),
      exec: vi.fn(),
    }),
    get: vi.fn(),
    setex: vi.fn(),
    del: vi.fn(),
  },
}));

const createMockRes = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response & {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
  };
};

describe('RealtimeSpeechController', () => {
  let serviceMock: any;
  let controller: RealtimeSpeechController;

  beforeEach(() => {
    serviceMock = {
      createWebRTCSession: vi.fn(),
      saveChatHistory: vi.fn(),
      getChatHistory: vi.fn(),
    };

    controller = new RealtimeSpeechController(serviceMock);
  });

  it('createSession은 유효한 요청에서 세션 정보를 반환한다', async () => {
    const req = {
      user: { userId: 1 },
      body: { plantId: 10 },
    } as unknown as Request;
    const res = createMockRes();

    serviceMock.createWebRTCSession.mockResolvedValue({
      ephemeralToken: 'token',
      expiresAt: 111,
      sessionId: 'sess',
    });

    await controller.createSession(req, res);

    expect(serviceMock.createWebRTCSession).toHaveBeenCalledWith(1, 10);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ ephemeralToken: 'token' }),
      }),
    );
  });

  it('createSession에서 plantId가 없으면 400을 반환한다', async () => {
    const req = { user: { userId: 1 }, body: {} } as Request;
    const res = createMockRes();

    await controller.createSession(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(serviceMock.createWebRTCSession).not.toHaveBeenCalled();
  });

  it('saveChatHistory는 서비스 레이어를 호출한다', async () => {
    const req = {
      user: { userId: 1 },
      body: { plantId: 2, userMessage: 'hi', assistantMessage: 'hello' },
    } as Request;
    const res = createMockRes();

    await controller.saveChatHistory(req, res);

    expect(serviceMock.saveChatHistory).toHaveBeenCalledWith(1, 2, 'hi', 'hello');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getChatHistory는 plantId 파라미터를 숫자로 파싱한다', async () => {
    const req = {
      user: { userId: 5 },
      params: { plantId: '9' },
    } as unknown as Request;
    const res = createMockRes();

    serviceMock.getChatHistory.mockResolvedValue([]);

    await controller.getChatHistory(req, res);

    expect(serviceMock.getChatHistory).toHaveBeenCalledWith(5, 9);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
