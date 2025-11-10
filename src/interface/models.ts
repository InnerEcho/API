import type { Optional } from 'sequelize';

/**
 * 모델 속성 인터페이스
 * DB 테이블의 스키마를 TypeScript 타입으로 정의
 */

// ==================== User ====================
export interface UserAttributes {
  user_id: number;
  user_email: string;
  user_name: string;
  user_gender: string;
  password: string;
  state?: string;
  created_at: Date;
}

// ==================== UserPlant ====================
export interface PlantAttributes {
  plant_id: number;
  user_id: number;
  species_id: number;
  nickname: string;
  plant_level: number;
  plant_experience: number;
  plant_hogamdo: number;
  last_measured_date: Date;
}

export interface PlantCreationAttributes
  extends Optional<PlantAttributes, 'plant_id' | 'last_measured_date'> {}

// ==================== Species ====================
export interface SpeciesAttributes {
  species_id: number;
  species_name: string;
  optimal_temp: number;
  optimal_light: number;
  optimal_moisture: number;
  description: string;
}

export interface SpeciesCreationAttributes
  extends Optional<SpeciesAttributes, 'species_id'> {}

// ==================== ChatHistory ====================
export interface ChatHistoryAttributes {
  history_id: number;
  message: string;
  user_id: number;
  plant_id: number;
  send_date: Date;
  user_type: 'User' | 'Bot';
}

export interface ChatHistoryCreationAttributes
  extends Optional<ChatHistoryAttributes, 'history_id'> {}

// ==================== GrowthDiary ====================
export interface GrowthDiaryAttributes {
  diary_id: number;
  user_id: number;
  title: string;
  dominant_emotion?: string | null;
  emotion_factor?: string | null;
  primary_mission?: string | null;
  content: string;
  image_url?: string;
  created_at: Date;
  updated_at: Date;
  is_deleted: boolean;
  edited: boolean;
}

export interface GrowthDiaryCreationAttributes
  extends Optional<
    GrowthDiaryAttributes,
    'diary_id' | 'created_at' | 'updated_at'
  > {}

// ==================== GrowthDiaryComment ====================
export interface GrowthDiaryCommentAttributes {
  comment_id: number;
  diary_id: number;
  user_id: number;
  content: string;
  created_at: Date;
  updated_at: Date;
  is_deleted: boolean;
  edited: boolean;
}

// ==================== UserFriends ====================
export interface UserFriendsAttributes {
  friend_id: number;
  user_id: number;
  friend_user_id: number;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: Date;
}

// ==================== UserEvent ====================
export interface UserEventAttributes {
  user_event_id: number;
  user_id: number;
  event_id: number;
  is_completed: boolean;
  completed_at?: Date;
  created_at: Date;
}

// ==================== EventInfo ====================
export interface EventAttributes {
  event_id: number;
  event_name: string;
  description: string;
  reward_experience: number;
  event_type: string;
  created_at: Date;
}

// ==================== RefreshToken ====================
export interface RefreshTokenAttributes {
  token_id: number;
  user_id: number;
  token: string;
  expires_at: Date;
  created_at: Date;
  ip_address?: string;
  user_agent?: string;
  is_revoked: boolean;
}

// ==================== TokenBlacklist ====================
export interface TokenBlacklistAttributes {
  blacklist_id: number;
  token: string;
  expires_at: Date;
  created_at: Date;
  reason?: string;
}
