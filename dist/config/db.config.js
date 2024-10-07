"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbConfig = void 0;
const development = {
    username: 'root',
    password: 'as060131',
    database: 'InnerEcho',
    host: 'localhost',
    dialect: 'mysql',
    port: 3306,
    logging: false
};
const test = {
    username: 'root',
    password: 'as060131',
    database: 'InnerEcho',
    host: 'localhost',
    dialect: 'mysql',
    port: 3306,
    logging: false
};
const production = {
    username: 'root',
    password: 'as060131',
    database: 'InnerEcho',
    host: 'localhost',
    dialect: 'mysql',
    port: 3306,
    logging: false
};
exports.dbConfig = {
    development,
    test,
    production
};
