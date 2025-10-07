import type { Request, Response, NextFunction } from 'express';

/**
 * Rate Limiter 미들웨어
 *
 * 메모리 기반 간단한 Rate Limiting (프로덕션에서는 Redis 사용 권장)
 * IP 주소별로 요청 횟수를 제한합니다.
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const rateLimitStore: RateLimitStore = {};

/**
 * Rate Limiter 생성 함수
 *
 * @param windowMs - 시간 윈도우 (밀리초)
 * @param maxRequests - 시간 윈도우 내 최대 요청 수
 * @param message - 제한 초과 시 응답 메시지
 */
export const createRateLimiter = (
  windowMs: number = 60000, // 1분
  maxRequests: number = 100, // 최대 100회
  message: string = 'Too many requests, please try again later'
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();

    // 클라이언트 정보 가져오기 또는 초기화
    if (!rateLimitStore[clientIp] || now > rateLimitStore[clientIp].resetTime) {
      rateLimitStore[clientIp] = {
        count: 0,
        resetTime: now + windowMs,
      };
    }

    // 요청 카운트 증가
    rateLimitStore[clientIp].count += 1;

    // 제한 초과 확인
    if (rateLimitStore[clientIp].count > maxRequests) {
      const retryAfter = Math.ceil((rateLimitStore[clientIp].resetTime - now) / 1000);

      res.status(429).json({
        code: 429,
        message,
        error: 'RATE_LIMIT_EXCEEDED',
        retryAfter: `${retryAfter} seconds`,
      });
      return;
    }

    // 응답 헤더에 제한 정보 추가
    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', (maxRequests - rateLimitStore[clientIp].count).toString());
    res.setHeader('X-RateLimit-Reset', new Date(rateLimitStore[clientIp].resetTime).toISOString());

    next();
  };
};

/**
 * 로그인 전용 Rate Limiter (더 엄격한 제한)
 *
 * 로그인 시도: 5분에 5회로 제한
 */
export const loginRateLimiter = createRateLimiter(
  5 * 60 * 1000, // 5분
  5, // 5회
  'Too many login attempts, please try again after 5 minutes'
);

/**
 * 일반 API Rate Limiter
 *
 * 일반 요청: 1분에 100회로 제한
 */
export const apiRateLimiter = createRateLimiter(
  60 * 1000, // 1분
  100, // 100회
  'Too many requests, please try again later'
);

/**
 * 만료된 Rate Limit 데이터 정리 (메모리 관리)
 * 주기적으로 실행 권장 (예: 10분마다)
 */
export const cleanupRateLimitStore = (): void => {
  const now = Date.now();
  Object.keys(rateLimitStore).forEach((key) => {
    if (now > rateLimitStore[key].resetTime) {
      delete rateLimitStore[key];
    }
  });
};

// 10분마다 자동 정리
setInterval(cleanupRateLimitStore, 10 * 60 * 1000);
