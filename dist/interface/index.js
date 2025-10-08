/**
 * 인터페이스 통합 export 파일
 *
 * 프로젝트의 모든 타입 정의를 중앙에서 관리합니다.
 *
 * 사용 예:
 * import { UserAttributes, ApiResult, PlantData } from '@/interface';
 */

// ==================== 공통 타입 ====================
export * from "./common.js";

// ==================== 모델 타입 ====================
export * from "./models.js";

// ==================== 서비스 타입 ====================
export * from "./services.js";

// ==================== 컨트롤러 타입 ====================
export * from "./controllers.js";

// ==================== 레거시 파일 (하위 호환성) ====================
// 아래 파일들은 점진적으로 제거 예정 (중복 export 방지를 위해 재수출 중단)
// export * from './api.js';
// export * from './db.js';
// export * from './plant.js';
// export * from './chatbot.js';