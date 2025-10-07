# JWT V2 구현 가이드

## 📋 개요

기존 JWT 단일 토큰 시스템을 **Access Token + Refresh Token** 이중 토큰 전략으로 개선한 V2 구현입니다.

---

## 🎯 주요 개선 사항

### 기존 (V1)
- ✅ Access Token만 사용 (24시간 유효)
- ❌ Refresh Token 없음
- ❌ 토큰 블랙리스트 관리 없음
- ❌ 토큰 갱신 메커니즘 없음
- ❌ Rate Limiting 없음

### 개선 (V2)
- ✅ Access Token (15분) + Refresh Token (7일)
- ✅ 토큰 블랙리스트 (로그아웃 시 무효화)
- ✅ 토큰 자동 갱신 메커니즘
- ✅ Rate Limiting (로그인 시도 제한)
- ✅ IP/User-Agent 추적
- ✅ req.user로 사용자 정보 접근 (req.body.user 대신)

---

## 📁 생성된 파일 구조

```
src/
├── models/
│   ├── RefreshToken.ts          # Refresh Token 저장 모델
│   ├── TokenBlacklist.ts        # 블랙리스트 모델
│   └── index.ts                 # 모델 등록 (업데이트)
│
├── services/
│   └── TokenService.ts          # 토큰 생성/검증/무효화 서비스
│
├── middlewares/
│   ├── authV2.ts                # V2 인증 미들웨어
│   └── rateLimiter.ts           # Rate Limiting 미들웨어
│
├── controllers/
│   └── AuthController.ts        # 인증 전용 컨트롤러
│
└── routes/
    └── authV2.ts                # V2 인증 라우터

migrations/
├── create-refresh-token-table.cjs
└── create-token-blacklist-table.cjs

.env.example                     # 환경변수 예시
```

---

## 🗄️ 데이터베이스 마이그레이션

### 1. 마이그레이션 실행

```bash
npm run migrate
```

### 2. 생성되는 테이블

#### `refresh_token`
```sql
CREATE TABLE refresh_token (
  token_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  token VARCHAR(500) UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,
  is_revoked BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
);
```

#### `token_blacklist`
```sql
CREATE TABLE token_blacklist (
  blacklist_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  token VARCHAR(500) UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  reason VARCHAR(100)
);
```

---

## ⚙️ 환경변수 설정

`.env` 파일에 다음 항목을 추가하세요:

```env
# V2 JWT 설정 (권장)
JWT_ACCESS_SECRET=your-access-token-secret-key
JWT_REFRESH_SECRET=your-refresh-token-secret-key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# V1 호환성 (기존 코드와의 호환)
JWT_AUTH_KEY=your-legacy-jwt-key
```

---

## 🔌 라우터 등록

`src/app.ts`에 V2 라우터를 추가하세요:

```typescript
import authV2Router from '@/routes/authV2.js';

// 기존 라우터
app.use('/auth', userRouter);  // V1 (기존 유지)

// V2 라우터 추가
app.use('/auth/v2', authV2Router);  // V2 (새로운 인증)
```

---

## 📡 API 엔드포인트

### 1. 로그인 (Access Token + Refresh Token 발급)

```http
POST /auth/v2/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**응답:**
```json
{
  "code": 200,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": "15m"
  }
}
```

---

### 2. Access Token 갱신

```http
POST /auth/v2/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**응답:**
```json
{
  "code": 200,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": "15m"
  }
}
```

---

### 3. 로그아웃

```http
POST /auth/v2/logout
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**응답:**
```json
{
  "code": 200,
  "message": "Logged out successfully"
}
```

---

### 4. 토큰 검증

```http
GET /auth/v2/verify
Authorization: Bearer <accessToken>
```

**응답:**
```json
{
  "code": 200,
  "message": "Token is valid",
  "data": {
    "user_id": 1,
    "user_email": "user@example.com",
    "user_name": "홍길동",
    "state": "중립",
    "plant_id": 5,
    "nickname": "금쪽이"
  }
}
```

---

### 5. 모든 세션 무효화 (강제 로그아웃)

```http
POST /auth/v2/revoke-all
Authorization: Bearer <accessToken>
```

**응답:**
```json
{
  "code": 200,
  "message": "All sessions have been revoked"
}
```

---

## 🔧 기존 코드 마이그레이션

### V1 미들웨어 사용 (기존)

```typescript
import { verifyToken } from '@/middlewares/auth.js';

router.get('/protected', verifyToken, (req, res) => {
  // req.body.user로 접근
  const userId = req.body.user.user_id;
});
```

### V2 미들웨어 사용 (권장)

```typescript
import { verifyTokenV2 } from '@/middlewares/authV2.js';

router.get('/protected', verifyTokenV2, (req, res) => {
  // req.user로 접근 (타입 안전)
  const userId = req.user.user_id;
});
```

---

## 🛡️ Rate Limiting

### 로그인 시도 제한

- **5분에 5회** 로그인 시도 제한
- 초과 시 `429 Too Many Requests` 응답

```typescript
import { loginRateLimiter } from '@/middlewares/rateLimiter.js';

router.post('/login', loginRateLimiter, authController.login);
```

### 일반 API 제한

- **1분에 100회** 요청 제한

```typescript
import { apiRateLimiter } from '@/middlewares/rateLimiter.js';

router.post('/refresh', apiRateLimiter, authController.refreshToken);
```

---

## 🔄 클라이언트 통합 예시

### 1. 로그인

```javascript
const response = await fetch('/auth/v2/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const { accessToken, refreshToken } = await response.json().data;

// Access Token: 메모리에 저장 (권장)
sessionStorage.setItem('accessToken', accessToken);

// Refresh Token: HttpOnly Cookie 또는 Secure Storage
localStorage.setItem('refreshToken', refreshToken);
```

### 2. API 요청

```javascript
const accessToken = sessionStorage.getItem('accessToken');

const response = await fetch('/api/protected', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

### 3. 토큰 만료 시 자동 갱신

```javascript
const response = await fetch('/api/protected', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});

if (response.status === 401) {
  // Access Token 만료
  const refreshToken = localStorage.getItem('refreshToken');

  const refreshResponse = await fetch('/auth/v2/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });

  const { accessToken: newAccessToken } = await refreshResponse.json().data;
  sessionStorage.setItem('accessToken', newAccessToken);

  // 재시도
  return fetch('/api/protected', {
    headers: { 'Authorization': `Bearer ${newAccessToken}` }
  });
}
```

---

## 🧹 토큰 정리 (Cron Job)

만료된 토큰을 주기적으로 삭제하려면 cron job을 설정하세요:

```typescript
import { TokenService } from '@/services/TokenService.js';

const tokenService = new TokenService();

// 매일 자정에 실행
setInterval(async () => {
  await tokenService.cleanupExpiredTokens();
}, 24 * 60 * 60 * 1000);
```

---

## 🚀 배포 전 체크리스트

- [ ] `.env`에 JWT 시크릿 키 설정 (강력한 랜덤 문자열)
- [ ] 데이터베이스 마이그레이션 실행
- [ ] `src/app.ts`에 V2 라우터 등록
- [ ] Rate Limiting 설정 확인
- [ ] 프로덕션 환경에서 `NODE_ENV=production` 설정
- [ ] HTTPS 사용 (토큰 보안)
- [ ] Refresh Token을 HttpOnly Cookie로 저장 권장
- [ ] CORS 설정 확인

---

## 📚 추가 개선 사항 (선택)

### 1. Redis 도입
- 토큰 블랙리스트를 Redis에 저장하여 성능 개선
- Rate Limiting을 Redis로 관리

### 2. JWT Rotation
- Refresh Token도 갱신 시마다 새로 발급 (보안 강화)

### 3. Multi-Device 관리
- 사용자별 여러 Refresh Token 허용
- 디바이스별 세션 관리

### 4. 보안 강화
- IP/위치 기반 의심스러운 로그인 감지
- 2FA (Two-Factor Authentication) 추가

---

## 🆘 트러블슈팅

### 문제: `TOKEN_EXPIRED` 에러
**해결:** `/auth/v2/refresh` 엔드포인트로 토큰 갱신

### 문제: `REFRESH_TOKEN_REVOKED` 에러
**해결:** 로그아웃되었으므로 재로그인 필요

### 문제: `RATE_LIMIT_EXCEEDED` 에러
**해결:** 일정 시간 대기 후 재시도

---

## 📞 문의

구현 중 문제가 발생하면 프로젝트 이슈 트래커에 등록해주세요.
