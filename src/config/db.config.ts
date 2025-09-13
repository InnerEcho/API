import 'dotenv/config';
import type { DbConfig } from "../interface/db.js";

const development: DbConfig = {
  username: `${process.env.DB_USER}`,
  password: `${process.env.DB_PASSWORD}`,
  database: `${process.env.DB_NAME}`,
  host: `${process.env.DB_HOST}`,
  dialect: 'mysql',
  port: Number(process.env.DB_PORT),
  timezone:'+09:00',
  logging: false
};

const test: DbConfig = {
  username: `${process.env.DB_USER}`,
  password: `${process.env.DB_PASSWORD}`,
  database: `${process.env.DB_NAME}`,
  host: `${process.env.DB_HOST}`,
  dialect: 'mysql',
  port: Number(process.env.DB_PORT),
  timezone:'+09:00',
  logging: false
};

const production: DbConfig = {
  username: `${process.env.DB_USER}`,
  password: `${process.env.DB_PASSWORD}`,
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