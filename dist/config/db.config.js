"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbConfig = void 0;
require("dotenv/config");
const development = {
    username: `${process.env.DB_USER}`,
    password: `${process.env.DB_PW}`,
    database: `${process.env.DB_NAME}`,
    host: `${process.env.DB_HOST}`,
    dialect: 'mysql',
    port: Number(process.env.DB_PORT),
    timezone: '+09:00',
    logging: false
};
const test = {
    username: `${process.env.DB_USER}`,
    password: `${process.env.DB_PW}`,
    database: `${process.env.DB_NAME}`,
    host: `${process.env.DB_HOST}`,
    dialect: 'mysql',
    port: Number(process.env.DB_PORT),
    timezone: '+09:00',
    logging: false
};
const production = {
    username: `${process.env.DB_USER}`,
    password: `${process.env.DB_PW}`,
    database: `${process.env.DB_NAME}`,
    host: `${process.env.DB_HOST}`,
    dialect: 'mysql',
    port: Number(process.env.DB_PORT),
    timezone: '+09:00',
    logging: false
};
exports.dbConfig = {
    development,
    test,
    production
};
