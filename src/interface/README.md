# Interface 디렉토리 구조

프로젝트의 모든 TypeScript 타입 정의를 중앙에서 관리합니다.

## 📁 파일 구조

```
interface/
├── index.ts           # 통합 export 파일 (모든 타입을 여기서 가져오세요)
├── common.ts          # 공통 타입 (API, DB, Socket, Rate Limiter 등)
├── models.ts          # 데이터베이스 모델 타입
├── services.ts        # 서비스 레이어 타입
├── controllers.ts     # 컨트롤러 레이어 타입
├── api.ts            # [레거시] ApiResult (하위 호환성)
├── db.ts             # [레거시] DbConfig (하위 호환성)
├── plant.ts          # [레거시] PlantData (하위 호환성)
└── chatbot.ts        # [레거시] ChatBot 관련 (하위 호환성)
```

## 🚀 사용 방법

### 권장 방법 (통합 import)

```typescript
// ✅ 권장: index.ts에서 모든 타입을 가져오기
import {
  ApiResult,
  UserAttributes,
  PlantData,
  AccessTokenPayload
} from '@/interface/index.js';

// 또는 줄여서
import type { ApiResult, UserAttributes } from '@/interface/index.js';
```

### 레거시 방법 (개별 파일 import)

```typescript
// ⚠️ 레거시: 개별 파일에서 가져오기 (곧 제거 예정)
import { ApiResult } from '@/interface/api.js';
import { PlantData } from '@/interface/plant.js';
```

## 📋 타입 카테고리

### 1. 공통 타입 (`common.ts`)
- `ApiResult`: API 응답 형식
- `DbConfig`: 데이터베이스 설정
- `ServerToClientEvents`, `ClientToServerEvents`: Socket.IO 이벤트
- `RateLimitStore`: Rate Limiter 스토어
- `SwaggerOptions`: Swagger 설정

### 2. 모델 타입 (`models.ts`)
데이터베이스 테이블 스키마에 대응하는 TypeScript 타입:
- `UserAttributes`: 사용자 정보
- `PlantAttributes`: 식물 정보
- `ChatHistoryAttributes`: 채팅 기록
- `GrowthDiaryAttributes`: 성장 일기
- `GrowthDiaryCommentAttributes`: 일기 댓글
- `RefreshTokenAttributes`: Refresh Token
- `TokenBlacklistAttributes`: Token Blacklist
- 기타 모델...

### 3. 서비스 타입 (`services.ts`)
비즈니스 로직에서 사용되는 타입:
- `AccessTokenPayload`, `RefreshTokenPayload`: JWT 페이로드
- `PlantData`, `PlantStateData`: 식물 상태
- `IMessage`, `ISendMessage`: 메시지 타입
- `PlantDbInfo`: 식물 DB 정보
- `UserType`, `BotType`: Enum 타입

### 4. 컨트롤러 타입 (`controllers.ts`)
HTTP 요청/응답 처리 타입:
- `DailyMission`: 일일 미션 인터페이스

## 🔄 마이그레이션 가이드

기존 코드를 새로운 구조로 마이그레이션하려면:

### Before (기존)
```typescript
import { ApiResult } from '@/interface/api.js';
import { PlantData } from '@/interface/plant.js';
import { IMessage } from '@/interface/chatbot.js';
```

### After (새로운 구조)
```typescript
import { ApiResult, PlantData, IMessage } from '@/interface/index.js';
```

## 📝 새로운 타입 추가하기

1. **적절한 파일 선택**
   - 모델 관련 → `models.ts`
   - 서비스 로직 관련 → `services.ts`
   - 컨트롤러 관련 → `controllers.ts`
   - 공통 타입 → `common.ts`

2. **타입 정의 추가**
```typescript
// models.ts
export interface NewModelAttributes {
  id: number;
  name: string;
  created_at: Date;
}
```

3. **자동으로 export됨** (index.ts에서 자동 처리)

## ⚠️ 주의사항

- **레거시 파일들** (`api.ts`, `db.ts`, `plant.ts`, `chatbot.ts`)은 하위 호환성을 위해 유지됩니다.
- 새로운 코드에서는 **반드시 `index.ts`에서 import**하세요.
- 레거시 파일들은 향후 버전에서 제거될 예정입니다.

## 🎯 Best Practices

1. ✅ **항상 `index.ts`에서 import**
2. ✅ **type import 사용** (`import type { ... }`)
3. ✅ **의미있는 타입명 사용**
4. ❌ **개별 파일에서 직접 import 금지** (레거시 제외)
5. ❌ **타입을 여러 파일에 중복 정의 금지**

## 📚 관련 문서

- [TypeScript 공식 문서](https://www.typescriptlang.org/docs/)
- [Sequelize TypeScript](https://sequelize.org/docs/v6/other-topics/typescript/)
