import type { Request, Response } from 'express';
import {
  TokenService,
  type AccessTokenPayload,
} from '@/services/auth/TokenService.js';
import { UserService } from '@/services/user/UserService.js';

/**
 * AuthController - JWT 인증 관련 컨트롤러
 *
 * 기존 UserController의 로그인/회원가입과 분리하여
 * 토큰 관리 전용 컨트롤러로 구성
 */
export class AuthController {
  private tokenService: TokenService;
  private userService: UserService;

  constructor(
    tokenService: TokenService = new TokenService(),
    userService: UserService = new UserService(),
  ) {
    this.tokenService = tokenService;
    this.userService = userService;
  }

  /**
   * 로그인 (Access Token + Refresh Token 발급)
   *
   * POST /auth/v2/login
   * Body: { email: string, password: string }
   */
  public async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          code: 400,
          message: 'Email and password are required',
        });
        return;
      }

      // 사용자 인증 (UserService 사용하지 않고 직접 구현)
      const user = await this.userService.getUserByEmail(email);

      if (!user) {
        res.status(400).json({
          code: 400,
          message: 'Email does not exist',
          error: 'NOT_EXIST_EMAIL',
        });
        return;
      }

      const isPasswordValid = await this.userService.verifyPassword(
        password,
        user.password,
      );

      if (!isPasswordValid) {
        res.status(400).json({
          code: 400,
          message: 'Incorrect password',
          error: 'INCORRECT_PASSWORD',
        });
        return;
      }

      // Access Token 생성 (plantId 없이)
      const accessTokenPayload: AccessTokenPayload = {
        userId: user.user_id,
        userEmail: user.user_email,
        userName: user.user_name,
        state: user.state,
      };

      const accessToken =
        this.tokenService.generateAccessToken(accessTokenPayload);

      // Refresh Token 생성
      const refreshToken = await this.tokenService.generateRefreshToken(
        user.user_id,
        req,
      );

      res.status(200).json({
        code: 200,
        message: 'Login successful',
        data: {
          accessToken,
          refreshToken,
          tokenType: 'Bearer',
          expiresIn: '15m', // Access Token 만료 시간
        },
      });
    } catch (error: any) {
      console.error('Login error:', error);

      res.status(500).json({
        code: 500,
        message: 'Login failed',
        error: error.message,
      });
    }
  }

  /**
   * Access Token 갱신 (Refresh Token 사용)
   *
   * POST /auth/v2/refresh
   * Body: { refreshToken: string }
   */
  public async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          code: 400,
          message: 'Refresh token is required',
        });
        return;
      }

      // 새로운 Access Token 발급
      const newAccessToken = await this.tokenService.refreshAccessToken(
        refreshToken,
      );

      res.status(200).json({
        code: 200,
        message: 'Token refreshed successfully',
        data: {
          accessToken: newAccessToken,
          tokenType: 'Bearer',
          expiresIn: '15m',
        },
      });
    } catch (error: any) {
      console.error('Token refresh error:', error);

      const errorMap: { [key: string]: { code: number; message: string } } = {
        REFRESH_TOKEN_EXPIRED: {
          code: 401,
          message: 'Refresh token has expired',
        },
        REFRESH_TOKEN_REVOKED: {
          code: 401,
          message: 'Refresh token has been revoked',
        },
        REFRESH_TOKEN_NOT_FOUND: {
          code: 401,
          message: 'Invalid refresh token',
        },
        INVALID_REFRESH_TOKEN: {
          code: 401,
          message: 'Invalid refresh token format',
        },
        USER_NOT_FOUND: { code: 404, message: 'User not found' },
      };

      const errorInfo = errorMap[error.message] || {
        code: 500,
        message: 'Token refresh failed',
      };

      res.status(errorInfo.code).json({
        code: errorInfo.code,
        message: errorInfo.message,
        error: error.message,
      });
    }
  }

  /**
   * 로그아웃 (Access Token + Refresh Token 무효화)
   *
   * POST /auth/v2/logout
   * Headers: Authorization: Bearer <accessToken>
   * Body: { refreshToken: string }
   */
  public async logout(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      const { refreshToken } = req.body;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(400).json({
          code: 400,
          message: 'Access token is required in Authorization header',
        });
        return;
      }

      const accessToken = authHeader.split('Bearer ')[1];

      // Access Token 블랙리스트에 추가
      await this.tokenService.revokeAccessToken(accessToken, 'logout');

      // Refresh Token 무효화 (선택적)
      if (refreshToken) {
        await this.tokenService.revokeRefreshToken(refreshToken);
      }

      res.status(200).json({
        code: 200,
        message: 'Logged out successfully',
      });
    } catch (error: any) {
      console.error('Logout error:', error);

      res.status(500).json({
        code: 500,
        message: 'Logout failed',
        error: error.message,
      });
    }
  }

  /**
   * 모든 세션 무효화 (강제 로그아웃)
   *
   * POST /auth/v2/revoke-all
   * Headers: Authorization: Bearer <accessToken>
   *
   * 사용 예: 계정 보안 위협 시, 모든 디바이스에서 강제 로그아웃
   */
  public async revokeAllSessions(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          code: 401,
          message: 'Authentication required',
        });
        return;
      }

      const userId = req.user.userId;

      // 사용자의 모든 Refresh Token 무효화
      await this.tokenService.revokeAllUserTokens(userId);

      // 현재 Access Token도 블랙리스트에 추가
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const accessToken = authHeader.split('Bearer ')[1];
        await this.tokenService.revokeAccessToken(accessToken, 'revoke_all');
      }

      res.status(200).json({
        code: 200,
        message: 'All sessions have been revoked',
      });
    } catch (error: any) {
      console.error('Revoke all sessions error:', error);

      res.status(500).json({
        code: 500,
        message: 'Failed to revoke sessions',
        error: error.message,
      });
    }
  }

  /**
   * 토큰 검증 (현재 토큰 상태 확인)
   *
   * GET /auth/v2/verify
   * Headers: Authorization: Bearer <accessToken>
   */
  public async verifyToken(req: Request, res: Response): Promise<void> {
    try {
      // verifyTokenV2 미들웨어를 통과했으므로 req.user가 존재
      if (!req.user) {
        res.status(401).json({
          code: 401,
          message: 'Invalid token',
        });
        return;
      }

      res.status(200).json({
        code: 200,
        message: 'Token is valid',
        data: req.user,
      });
    } catch (error: any) {
      console.error('Token verification error:', error);

      res.status(401).json({
        code: 401,
        message: 'Token verification failed',
        error: error.message,
      });
    }
  }

  /**
   * 회원가입 (Access Token + Refresh Token 발급)
   *
   * POST /auth/v2/register
   * Body: { email: string, password: string, userName: string, userGender: string, plantNickname: string }
   */
  public async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, userName, userGender, plantNickname } = req.body;

      // Validation
      if (!email || !password || !userName || !userGender || !plantNickname) {
        res.status(400).json({
          code: 400,
          message: 'All fields are required',
          error: 'MISSING_FIELDS',
        });
        return;
      }

      // Use UserService to create user and plant
      const registeredUser = await this.userService.signUp(
        userName,
        email,
        password,
        userGender,
        plantNickname,
      );

      // Generate tokens immediately
      const accessTokenPayload: AccessTokenPayload = {
        userId: registeredUser.user_id,
        userEmail: registeredUser.user_email,
        userName: registeredUser.user_name,
        state: registeredUser.state || '중립',
      };

      const accessToken = this.tokenService.generateAccessToken(accessTokenPayload);
      const refreshToken = await this.tokenService.generateRefreshToken(
        registeredUser.user_id,
        req,
      );

      res.status(201).json({
        code: 201,
        message: 'Registration successful',
        data: {
          accessToken,
          refreshToken,
          tokenType: 'Bearer',
          expiresIn: '15m',
          user: {
            userId: registeredUser.user_id,
            userEmail: registeredUser.user_email,
            userName: registeredUser.user_name,
          },
        },
      });
    } catch (error: any) {
      console.error('Registration error:', error);

      // Handle specific errors
      const errorMap: Record<string, { code: number; message: string }> = {
        ExistEmail: {
          code: 400,
          message: 'Email already exists',
        },
        ExistNickName: {
          code: 400,
          message: 'Nickname already exists',
        },
      };

      const errorInfo = errorMap[error.message] || {
        code: 500,
        message: 'Registration failed',
      };

      res.status(errorInfo.code).json({
        code: errorInfo.code,
        message: errorInfo.message,
        error: error.message,
      });
    }
  }
}
