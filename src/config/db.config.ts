import 'dotenv/config';
import { DbConfig } from "../interface/db";

console.log("sdfsdfsdfs",process.env.DB_PW);

const development: DbConfig = {
  username: 'root',
  password: '@as060131',
  database: 'innerecho',
  host: 'localhost',
  dialect: 'mysql',
  port: 3306,
  timezone:'+09:00',
  logging: false
};

const test: DbConfig = {
  username: 'root',
  password: '@as060131',
  database: `${process.env.DB_NAME}`,
  host: 'localhost',
  dialect: 'mysql',
  port: 3306,
  timezone:'+09:00',
  logging: false
};

const production: DbConfig = {
  username: 'root',
  password: '@as060131',
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