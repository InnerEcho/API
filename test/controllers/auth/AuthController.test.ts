import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Request, Response } from 'express';
import { AuthController } from '@/controllers/auth/AuthController.js';

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

describe('AuthController', () => {
  let tokenServiceMock: any;
  let userServiceMock: any;
  let controller: AuthController;

  beforeEach(() => {
    tokenServiceMock = {
      generateAccessToken: vi.fn(),
      generateRefreshToken: vi.fn(),
      refreshAccessToken: vi.fn(),
      revokeAccessToken: vi.fn(),
      revokeRefreshToken: vi.fn(),
    };

    userServiceMock = {
      getUserByEmail: vi.fn(),
      verifyPassword: vi.fn(),
      signUp: vi.fn(),
    };

    controller = new AuthController(tokenServiceMock, userServiceMock);
  });

  it('login 성공 시 토큰과 함께 200을 반환한다', async () => {
    const req = {
      body: { email: 'user@example.com', password: 'pw' },
    } as Request;
    const res = createMockRes();

    userServiceMock.getUserByEmail.mockResolvedValue({
      user_id: 1,
      user_email: 'user@example.com',
      user_name: '홍길동',
      password: 'hashed',
      state: '중립',
    });
    userServiceMock.verifyPassword.mockResolvedValue(true);
    tokenServiceMock.generateAccessToken.mockReturnValue('access');
    tokenServiceMock.generateRefreshToken.mockResolvedValue('refresh');

    await controller.login(req, res);

    expect(userServiceMock.getUserByEmail).toHaveBeenCalledWith('user@example.com');
    expect(tokenServiceMock.generateAccessToken).toHaveBeenCalledWith({
      userId: 1,
      userEmail: 'user@example.com',
      userName: '홍길동',
      state: '중립',
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 200,
        data: expect.objectContaining({
          accessToken: 'access',
          refreshToken: 'refresh',
        }),
      }),
    );
  });

  it('login 파라미터가 없으면 400을 반환한다', async () => {
    const req = { body: { email: '', password: '' } } as Request;
    const res = createMockRes();

    await controller.login(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 400,
      }),
    );
    expect(userServiceMock.getUserByEmail).not.toHaveBeenCalled();
  });

  it('refreshToken 성공 시 새로운 access token을 제공한다', async () => {
    const req = { body: { refreshToken: 'refresh-token' } } as Request;
    const res = createMockRes();
    tokenServiceMock.refreshAccessToken.mockResolvedValue('new-access');

    await controller.refreshToken(req, res);

    expect(tokenServiceMock.refreshAccessToken).toHaveBeenCalledWith('refresh-token');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ accessToken: 'new-access' }),
      }),
    );
  });

  it('logout 시 토큰을 블랙리스트에 추가한다', async () => {
    const req = {
      headers: { authorization: 'Bearer access-token' },
      body: { refreshToken: 'refresh-token' },
    } as Request;
    const res = createMockRes();

    await controller.logout(req, res);

    expect(tokenServiceMock.revokeAccessToken).toHaveBeenCalledWith('access-token', 'logout');
    expect(tokenServiceMock.revokeRefreshToken).toHaveBeenCalledWith('refresh-token');
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
