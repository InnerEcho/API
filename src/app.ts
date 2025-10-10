#!/usr/bin/env node

import createError from 'http-errors';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import debugModule from 'debug';

//Swagger 설정 가져오기
import { swaggerUi, specs } from '@/config/swagger.config.js';

// 라우터와 데이터베이스 모델 가져오기
import indexRouter from '@/routes/index.js';
import userRouter from '@/routes/user.js';
import authV2Router from '@/routes/authV2.js';
import chatRouter from '@/routes/chat.js';
import plantRouter from '@/routes/plant.js';
import diaryRouter from '@/routes/diary.js';
import speechRouter from '@/routes/speech.js';
import missionRouter from '@/routes/mission.js';
import friendRouter from '@/routes/friend.js';
import emotionRouter from '@/routes/emotion.js';
import db from '@/models/index.js';
import YAML from 'yamljs';

dotenv.config();

process.on('uncaughtException', err => {
  console.error('[UncaughtException]', err);
});

const app = express();
const swaggerDocument = YAML.load('./src/docs/leafy.yaml');

// .env의 PORT를 Swagger 문서에 동적으로 적용
const PORT = process.env.PORT || 3000;
if (swaggerDocument.servers) {
  swaggerDocument.servers = swaggerDocument.servers.map((server: any) => {
    if (server.url.includes('localhost')) {
      return { ...server, url: `http://localhost:${PORT}` };
    }
    return server;
  });
}

// db.sequelize
//   .sync({ alter: true }) // 데이터베이스 자동 생성 (force: true는 기존 테이블을 삭제하고 새로 만듦)
//   .catch((err: Error) => {
//     console.error('Unable to create DB:', err);
//   });

// 재시도 관련 상수 (타입을 명시적으로 지정)
const MAX_RETRIES: number = 5;
const RETRY_DELAY: number = 5000; // 5초 (ms)

/**
 * DB 연결을 재시도하는 함수.
 * @param retries 남은 재시도 횟수
 * @returns 연결 성공 또는 프로세스 종료로 인해 반환 값 없음 (Promise<void>)
 */
const connectWithRetry = async (retries: number = MAX_RETRIES): Promise<void> => {
  try {
    // 1. DB 연결 인증
    await db.sequelize.authenticate();
    console.log('DB 연결 성공');

    // 2. DB 모델 동기화
    await db.sequelize.sync({ alter: true }); // alter: true 옵션 등을 추가할 수 있습니다.
    console.log('모델 동기화 완료');

  } catch (err: unknown) { // 3. catch 절의 에러 변수는 'unknown' 타입으로 지정
    
    // 4. 에러가 Error 인스턴스인지 확인하여 타입 안정성 확보
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`DB 연결 실패. 남은 시도: ${retries - 1}`, errorMessage);

    if (retries > 1) {
      // 5. 재귀 호출 (setTimeout은 Promise를 반환하지 않으므로 await 없음)
      setTimeout(() => connectWithRetry(retries - 1), RETRY_DELAY);
    } else {
      console.error('DB 연결 시도 모두 실패. 서버 종료');
      process.exit(1);
    }
  }
};

// 애플리케이션 시작 시 DB 연결 함수 호출
connectWithRetry();


const debug = debugModule('ohgnoy-backend:server');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORS 설정
app.use(cors());

// 뷰 엔진 설정
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// 미들웨어 설정
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// 라우터 설정
app.use('/', indexRouter);
app.use('/users', userRouter);         // 사용자 리소스
app.use('/auth', userRouter);          // 인증 리소스 (세션, 인증) - V1
app.use('/auth/v2', authV2Router);     // 인증 V2 리소스 (Access Token + Refresh Token)
app.use('/emotions', emotionRouter);   // 감정 리소스
app.use('/chat', chatRouter);          // 채팅 리소스
app.use('/plant', plantRouter);        // 식물 리소스 (상태, 경험치, 호감도 포함)
app.use('/diaries', diaryRouter);      // 일기 리소스 (댓글 포함: /diaries/:diary_id/comments)
app.use('/speech', speechRouter);      // 음성 리소스
app.use('/missions', missionRouter);   // 미션 리소스
app.use('/friends', friendRouter);     // 친구 리소스

//swagger 모듈 호출하기
app.use('/api-docs-old', swaggerUi.serve, swaggerUi.setup(specs));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 404 에러 핸들링
app.use((req: Request, res: Response, next: NextFunction) => {
  next(createError(404));
});

// 에러 핸들러
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  // 에러 로깅
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // 라우터 관련 에러인 경우 더 자세한 정보 제공
  if (
    err.message.includes('Route') &&
    err.message.includes('requires a callback function')
  ) {
    console.error('Router Error:', {
      path: req.path,
      method: req.method,
      error: err.message,
    });
  }

  res.status(err.status || 500);
  res.json({
    code: err.status || 500,
    msg: err.message,
    path: req.path,
    method: req.method,
  });
});

/**
 * 서버 설정
 */
const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

const server = http.createServer(app);

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

function normalizePort(val: string): number | string | boolean {
  const port = parseInt(val, 10);
  if (isNaN(port)) {
    return val;
  }
  if (port >= 0) {
    return port;
  }
  return false;
}

function onError(error: NodeJS.ErrnoException): void {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening(): void {
  const addr = server.address();
  const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr?.port;
  debug('Listening on ' + bind);
}

export default app;
