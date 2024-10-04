import path from 'path';
import { Sequelize, Dialect } from 'sequelize';
import configFile from '../config/config.json';

interface DatabaseConfig {
  database: string | null;  // database가 null일 수 있으므로 명시적으로 정의
  username: string | null;  // username이 null일 수 있음
  password: string | null;  // password가 null일 수 있음
  host: string | null;      // host가 null일 수 있음
  dialect: Dialect;         // Sequelize에서 제공하는 Dialect 타입
  logging: boolean;         // logging 옵션
}


const env = process.env.NODE_ENV || 'development';
const config = configFile[env as keyof typeof configFile];

const db: any = {};

const sequelize = new Sequelize(
  config.database || 'default_db', // null 처리
  config.username || 'default_user',
  config.password || 'default_pass',
  {
    host: config.host || 'localhost',
    dialect: config.dialect as Dialect,
    logging: config.logging,
  }
);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
