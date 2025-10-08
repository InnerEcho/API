import type { Request, Response, NextFunction } from 'express';
import { TokenService } from '@/services/TokenService.js';

// Request 타입 확장 (user 필드 추가)
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        userEmail: string;
        userName: string;
        state: string;
      };
    }
  }
}

/**
 * V2 인증 미들웨어 (Access Token + Blacklist 검증)
 *
 * 기존 auth.ts와 차이점:
 * - req.body.user 대신 req.user 사용
 * - 토큰 블랙리스트 검증 추가
 * - 더 자세한 에러 메시지 (TOKEN_EXPIRED, TOKEN_REVOKED 등)
 * - TokenService를 통한 중앙화된 토큰 관리
 */
export const verifyTokenV2 = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      code: 401,
      message: 'Authorization token missing',
      error: 'MISSING_TOKEN',
    });
    return;
  }

  const token = authHeader.split('Bearer ')[1];

  if (!token) {
    res.status(401).json({
      code: 401,
      message: 'Authorization token missing',
      error: 'MISSING_TOKEN',
    });
    return;
  }

  try {
    const tokenService = new TokenService();
    const decoded = await tokenService.verifyAccessToken(token);

    // req.user에 저장 (req.body가 아님)
    req.user = {
      userId: decoded.userId,
      userEmail: decoded.userEmail,
      userName: decoded.userName,
      state: decoded.state,
    };

    next();
  } catch (error: any) {
    console.error('Token verification failed:', error.message);

    // 에러 타입별 응답
    switch (error.message) {
      case 'TOKEN_EXPIRED':
        res.status(401).json({
          code: 401,
          message: 'Access token has expired',
          error: 'TOKEN_EXPIRED',
        });
        break;

      case 'TOKEN_REVOKED':
        res.status(401).json({
          code: 401,
          message: 'Token has been revoked (logged out)',
          error: 'TOKEN_REVOKED',
        });
        break;

      case 'INVALID_TOKEN':
        res.status(401).json({
          code: 401,
          message: 'Invalid token format',
          error: 'INVALID_TOKEN',
        });
        break;

      default:
        res.status(401).json({
          code: 401,
          message: 'Token verification failed',
          error: 'VERIFICATION_FAILED',
        });
    }
  }
};

/**
 * 선택적 인증 미들웨어 (토큰이 있으면 검증, 없어도 통과)
 *
 * 사용 예: 로그인 여부에 따라 다른 응답을 보내는 API
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // 토큰이 없으면 그냥 통과
    next();
    return;
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const tokenService = new TokenService();
    const decoded = await tokenService.verifyAccessToken(token);

    req.user = {
      userId: decoded.userId,
      userEmail: decoded.userEmail,
      userName: decoded.userName,
      state: decoded.state,
    };
  } catch (error) {
    // 토큰 검증 실패해도 통과 (req.user는 undefined)
    console.log(
      'Optional auth: Token verification failed, proceeding without user',
    );
  }

  next();
};
