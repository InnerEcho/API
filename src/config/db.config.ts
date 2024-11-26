import { DbConfig } from "../interface/db";
import dotenv from 'dotenv';
dotenv.config();

const development: DbConfig = {
  username: 'root',
  password: `${process.env.DB_PW}`,
  database: `${process.env.DB_NAME}`,
  host: 'localhost',
  dialect: 'mysql',
  port: 3306,
  timezone:'+09:00',
  logging: false
};

const test: DbConfig = {
  username: 'root',
  password: `${process.env.DB_PW}`,
  database: `${process.env.DB_NAME}`,
  host: 'localhost',
  dialect: 'mysql',
  port: 3306,
  timezone:'+09:00',
  logging: false
};

const production: DbConfig = {
  username: 'root',
  password: `${process.env.DB_PW}`,
  database: `${process.env.DB_NAME}`,
  host: 'localhost',
  dialect: 'mysql',
  port: 3306,
  timezone:'+09:00',
  logging: false
};

export const dbConfig = {
  development,
  test,
  production
};