import 'dotenv/config';
import { DbConfig } from "../interface/db";

const development: DbConfig = {
  username: `${process.env.DB_USER}`,
  password: `${process.env.DB_PW}`,
  database: `${process.env.DB_NAME}`,
  host: `${process.env.DB_HOST}`,
  dialect: 'mysql',
  port: Number(process.env.DB_PORT),
  timezone:'+09:00',
  logging: false
};

const test: DbConfig = {
  username: `${process.env.DB_USER}`,
  password: `${process.env.DB_PW}`,
  database: `${process.env.DB_NAME}`,
  host: `${process.env.DB_HOST}`,
  dialect: 'mysql',
  port: Number(process.env.DB_PORT),
  timezone:'+09:00',
  logging: false
};

const production: DbConfig = {
  username: `${process.env.DB_USER}`,
  password: `${process.env.DB_PW}`,
  database: `${process.env.DB_NAME}`,
  host: `${process.env.DB_HOST}`,
  dialect: 'mysql',
  port: Number(process.env.DB_PORT),
  timezone:'+09:00',
  logging: false
};

export const dbConfig = {
  development,
  test,
  production
};