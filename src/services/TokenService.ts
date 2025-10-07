import jwt from 'jsonwebtoken';
import type { Request } from 'express';
import db from '@/models/index.js';

// Access Token Payload 타입
export interface AccessTokenPayload {
  user_id: number;
  user_email: string;
  user_name: string;
  state: string;
  plant_id: number | null;
  nickname: string | null;
}

// Refresh Token Payload 타입
interface RefreshTokenPayload {
  user_id: number;
  token_id: number; // 데이터베이스의 refresh_token ID
}

// 토큰 검증 결과 타입
export interface VerifiedTokenPayload extends AccessTokenPayload {
  iat: number;
  exp: number;
  iss: string;
}

export class TokenService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenExpiry: string;

  constructor() {
    // 환경변수에서 시크릿 키 가져오기
    this.accessTokenSecret =
      process.env.JWT_ACCESS_SECRET || process.env.JWT_AUTH_KEY || '';
    this.refreshTokenSecret =
      process.env.JWT_REFRESH_SECRET || process.env.JWT_AUTH_KEY || '';
    this.accessTokenExpiry = process.env.JWT_ACCESS_EXPIRY || '15m';
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';

    if (!this.accessTokenSecret || !this.refreshTokenSecret) {
      throw new Error(
        'JWT secret keys are not configured in environment variables',
      );
    }
  }

  /**
   * Access Token 생성 (짧은 유효기간: 15분)
   */
  public generateAccessToken(payload: AccessTokenPayload): string {
    return jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry as string | number,
      issuer: 'InnerEcho',
    } as jwt.SignOptions);
  }

  /**
   * Refresh Token 생성 및 DB 저장 (긴 유효기간: 7일)
   */
  public async generateRefreshToken(
    userId: number,
    req: Request,
  ): Promise<string> {
    const ipAddress = req.ip || req.connection.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;

    // 만료 시간 계산
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7일 후

    // DB에 저장할 토큰 레코드 생성
    const tokenRecord = await db.RefreshToken.create({
      user_id: userId,
      token: 'placeholder', // 임시로 placeholder 사용 (아래에서 업데이트)
      expires_at: expiresAt,
      ip_address: ipAddress,
      user_agent: userAgent,
      is_revoked: false,
    });

    // JWT 생성 (token_id 포함)
    const refreshTokenPayload: RefreshTokenPayload = {
      user_id: userId,
      token_id: tokenRecord.token_id,
    };

    const refreshToken = jwt.sign(
      refreshTokenPayload,
      this.refreshTokenSecret,
      {
        expiresIn: this.refreshTokenExpiry as string | number,
        issuer: 'InnerEcho',
      } as jwt.SignOptions,
    );

    // DB의 token 필드 업데이트
    await tokenRecord.update({ token: refreshToken });

    return refreshToken;
  }

  /**
   * Access Token 검증
   */
  public async verifyAccessToken(token: string): Promise<VerifiedTokenPayload> {
    try {
      // 블랙리스트 체크
      const isBlacklisted = await db.TokenBlacklist.findOne({
        where: { token },
      });

      if (isBlacklisted) {
        throw new Error('TOKEN_REVOKED');
      }

      // JWT 검증
      const decoded = jwt.verify(
        token,
        this.accessTokenSecret,
      ) as VerifiedTokenPayload;
      return decoded;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('TOKEN_EXPIRED');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('INVALID_TOKEN');
      } else if (error.message === 'TOKEN_REVOKED') {
        throw error;
      }
      throw new Error('TOKEN_VERIFICATION_FAILED');
    }
  }

  /**
   * Refresh Token 검증
   */
  public async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    try {
      // JWT 검증
      const decoded = jwt.verify(
        token,
        this.refreshTokenSecret,
      ) as RefreshTokenPayload;

      // DB에서 토큰 확인
      const tokenRecord = await db.RefreshToken.findOne({
        where: {
          token_id: decoded.token_id,
          token,
        },
      });

      if (!tokenRecord) {
        throw new Error('REFRESH_TOKEN_NOT_FOUND');
      }

      if (tokenRecord.is_revoked) {
        throw new Error('REFRESH_TOKEN_REVOKED');
      }

      if (new Date() > new Date(tokenRecord.expires_at)) {
        throw new Error('REFRESH_TOKEN_EXPIRED');
      }

      return decoded;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('REFRESH_TOKEN_EXPIRED');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('INVALID_REFRESH_TOKEN');
      } else if (error.message.startsWith('REFRESH_TOKEN_')) {
        throw error;
      }
      throw new Error('REFRESH_TOKEN_VERIFICATION_FAILED');
    }
  }

  /**
   * Access Token 갱신 (Refresh Token으로 새 Access Token 발급)
   */
  public async refreshAccessToken(refreshToken: string): Promise<string> {
    const decoded = await this.verifyRefreshToken(refreshToken);

    // 사용자 정보 조회
    const user = await db.User.findOne({
      where: { user_id: decoded.user_id },
    });

    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    // 사용자의 식물 정보 조회
    const plant = await db.Plant.findOne({
      where: { user_id: user.user_id },
      order: [['plant_id', 'DESC']], // 가장 최근 식물
    });

    // 새로운 Access Token 생성
    const accessTokenPayload: AccessTokenPayload = {
      user_id: user.user_id,
      user_email: user.user_email,
      user_name: user.user_name,
      state: user.state,
      plant_id: plant?.plant_id || null,
      nickname: plant?.nickname || null,
    };

    return this.generateAccessToken(accessTokenPayload);
  }

  /**
   * Access Token 블랙리스트 추가 (로그아웃)
   */
  public async revokeAccessToken(
    token: string,
    reason: string = 'logout',
  ): Promise<void> {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) {
        throw new Error('INVALID_TOKEN_FORMAT');
      }

      // 만료 시간까지만 블랙리스트에 유지
      const expiresAt = new Date(decoded.exp * 1000);

      await db.TokenBlacklist.create({
        token,
        expires_at: expiresAt,
        reason,
      });
    } catch (error) {
      console.error('Failed to revoke access token:', error);
      throw new Error('TOKEN_REVOCATION_FAILED');
    }
  }

  /**
   * Refresh Token 무효화 (DB에서 삭제 또는 revoke 플래그 설정)
   */
  public async revokeRefreshToken(token: string): Promise<void> {
    try {
      const decoded = jwt.decode(token) as RefreshTokenPayload;
      if (!decoded || !decoded.token_id) {
        throw new Error('INVALID_REFRESH_TOKEN_FORMAT');
      }

      const tokenRecord = await db.RefreshToken.findOne({
        where: { token_id: decoded.token_id },
      });

      if (tokenRecord) {
        await tokenRecord.update({ is_revoked: true });
      }
    } catch (error) {
      console.error('Failed to revoke refresh token:', error);
      throw new Error('REFRESH_TOKEN_REVOCATION_FAILED');
    }
  }

  /**
   * 사용자의 모든 Refresh Token 무효화 (강제 로그아웃)
   */
  public async revokeAllUserTokens(userId: number): Promise<void> {
    try {
      await db.RefreshToken.update(
        { is_revoked: true },
        { where: { user_id: userId } },
      );
    } catch (error) {
      console.error('Failed to revoke all user tokens:', error);
      throw new Error('TOKEN_REVOCATION_FAILED');
    }
  }

  /**
   * 만료된 토큰 정리 (크론잡으로 실행 권장)
   */
  public async cleanupExpiredTokens(): Promise<void> {
    try {
      const now = new Date();

      // 만료된 Refresh Token 삭제
      await db.RefreshToken.destroy({
        where: {
          expires_at: { [db.Sequelize.Op.lt]: now },
        },
      });

      // 만료된 블랙리스트 삭제
      await db.TokenBlacklist.destroy({
        where: {
          expires_at: { [db.Sequelize.Op.lt]: now },
        },
      });

      console.log('Expired tokens cleaned up successfully');
    } catch (error) {
      console.error('Failed to cleanup expired tokens:', error);
    }
  }
}
