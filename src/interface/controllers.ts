/**
 * 컨트롤러 레이어 인터페이스
 * HTTP 요청/응답 처리에 사용되는 타입 정의
 */

// ==================== Mission Controller ====================
export interface DailyMission {
  start(): void;
  evaluate(): boolean;
}
