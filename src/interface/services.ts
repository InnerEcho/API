/**
 * 서비스 레이어 인터페이스
 * 비즈니스 로직에서 사용되는 타입 정의
 */

// ==================== Token Service ====================
export interface AccessTokenPayload {
  userId: number;
  userEmail: string;
  userName: string;
  state: string | null;
}

export interface RefreshTokenPayload {
  userId: number;
  userEmail: string;
  token_id: number;
}

export interface VerifiedTokenPayload extends AccessTokenPayload {
  iat: number;
  exp: number;
}

// ==================== Plant Service ====================
export interface PlantData {
  plant_name: string;
  level: number;
  experience: number;
  likeability: number;
}

export interface CurrentData {
  current_temp: number;
  current_light: number;
  current_moisture: number;
}

export interface StateData {
  temp_state: '높음' | '정상' | '낮음';
  light_state: '높음' | '정상' | '낮음';
  moisture_state: '높음' | '정상' | '낮음';
}

export interface PlantFullData extends CurrentData, StateData {}

// ==================== ChatBot Service ====================
export type ResponseData = {
  code: number;
  data: string | null | IMessage;
  msg: string;
};

export interface IMessage {
  userId: number;
  plantId: number;
  message: string | undefined;
  sendDate: Date;
  userType: UserType;
  historyId?: number | null;
  emotion?: string | null;
  factor?: string | null;
}

export interface IMessageDb {
  user_id: number;
  plant_id: number;
  message: string;
  send_date: Date;
  user_type: UserType;
}

export enum UserType {
  USER = 'User',
  BOT = 'Bot',
}

export interface ISendMessage {
  role: string;
  message: string;
}

export enum BotType {
  LLMGPT = 'LLMGPT',
  LLMGEMINI = 'LLMGEMINI',
  RAGDOC = 'RAGDOC',
  RAGWEB = 'RAGWEB',
}

/**
 * 식물 챗봇을 위한 사용자 & 식물 정보 타입
 */
export interface PlantDbInfo {
  userName: string;
  nickname: string;
  speciesName: string;
}
