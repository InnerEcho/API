"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const db_config_1 = require("../config/db.config");
const env = process.env.NODE_ENV || 'development';
const config = db_config_1.dbConfig[env];
const db = {};
const sequelize = new sequelize_1.Sequelize(config.database || 'default_db', config.username || 'default_user', config.password || 'default_pass', {
    host: config.host || 'localhost',
    dialect: config.dialect,
    logging: config.logging || false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    retry: {
        max: 3
    }
});
sequelize.authenticate()
    .then(() => {
    console.log('Database connection established successfully.');
})
    .catch((err) => {
    console.error('Unable to connect to the database:', err.message);
});
db.sequelize = sequelize;
db.Sequelize = sequelize_1.Sequelize;
exports.default = db;
