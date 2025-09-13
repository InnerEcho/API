import 'dotenv/config';
const development = {
  username: `${process.env.DB_USER}`,
  password: `${process.env.DB_PASSWORD}`,
  database: `${process.env.DB_NAME}`,
  host: `${process.env.DB_HOST}`,
  dialect: 'mysql',
  port: Number(process.env.DB_PORT),
  timezone: '+09:00',
  logging: false
};
const test = {
  username: `${process.env.DB_USER}`,
  password: `${process.env.DB_PASSWORD}`,
  database: `${process.env.DB_NAME}`,
  host: `${process.env.DB_HOST}`,
  dialect: 'mysql',
  port: Number(process.env.DB_PORT),
  timezone: '+09:00',
  logging: false
};
const production = {
  username: `${process.env.DB_USER}`,
  password: `${process.env.DB_PASSWORD}`,
  database: `${process.env.DB_NAME}`,
  host: `${process.env.DB_HOST}`,
  dialect: 'mysql',
  port: Number(process.env.DB_PORT),
  timezone: '+09:00',
  logging: false
};
export const dbConfig = {
  development,
  test,
  production
};