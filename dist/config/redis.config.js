import { Redis } from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

//Redis 클라이언트 인스턴스 생성
//.env 파일에 REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
const redisClient = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD
});
redisClient.on('connect', () => {
  console.log('✅ Redis client connected');
});
redisClient.on('error', err => {
  console.error('❌ Redis client connection error', err);
});
export default redisClient;