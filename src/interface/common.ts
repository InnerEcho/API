/**
 * 공통 인터페이스
 * 여러 레이어에서 공통으로 사용되는 타입 정의
 */

// ==================== API Response ====================
export interface ApiResult {
  code: number;
  data: any;
  msg: string;
}

// ==================== Database Config ====================
export interface DbConfig {
  username: string;
  password: string;
  database: string;
  host: string;
  dialect: string;
  port: number;
  timezone: string;
  logging: boolean;
}

// ==================== Socket.IO Events ====================
export interface ServerToClientEvents {
  receiveAll: (message: string) => void;
  broadCastAll: (nickName: string, message: string) => void;
  entryOk: (message: string) => void;
  receiveChannel: (message: string) => void;
  exitOk: (message: string) => void;
}

export interface ClientToServerEvents {
  broadcast: (message: string) => void;
  sendAll: (nickName: string, message: string) => void;
  entry: (channel: string, nickName: string) => void;
  channelMsg: (msgData: MsgData) => void;
  exit: (channel: string, nickName: string) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  name: string;
  age: number;
}

export interface MsgData {
  channel: string;
  nickName: string;
  message: string;
}

// ==================== Rate Limiter ====================
export interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// ==================== Swagger Config ====================
export interface SwaggerOptions {
  definition: {
    openapi: string;
    info: {
      title: string;
      description: string;
      contact: {
        name: string;
        email: string;
      };
      version: string;
    };
    servers: Array<{
      url: string;
      description: string;
    }>;
  };
  apis: string[];
}
