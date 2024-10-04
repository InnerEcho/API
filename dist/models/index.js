"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const config_json_1 = __importDefault(require("../config/config.json"));
const env = process.env.NODE_ENV || 'development';
const config = config_json_1.default[env];
const db = {};
const sequelize = new sequelize_1.Sequelize(config.database || 'default_db', // null 처리
config.username || 'default_user', config.password || 'default_pass', {
    host: config.host || 'localhost',
    dialect: config.dialect,
    logging: config.logging,
});
db.sequelize = sequelize;
db.Sequelize = sequelize_1.Sequelize;
exports.default = db;
