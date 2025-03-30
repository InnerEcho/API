"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const db_config_1 = require("../config/db.config");
const user_1 = __importDefault(require("./user")); // 모델 파일 import
const userPlantInfo_1 = __importDefault(require("./userPlantInfo"));
const optimalSpeciesInfo_1 = __importDefault(require("./optimalSpeciesInfo"));
const eventInfo_1 = __importDefault(require("./eventInfo"));
const userEventInfo_1 = __importDefault(require("./userEventInfo"));
const plantHistory_1 = __importDefault(require("./plantHistory"));
// 현재 환경을 가져옴 (development, test, production)
const env = process.env.NODE_ENV || 'development';
const config = db_config_1.dbConfig[env];
// Sequelize 인스턴스 생성
const sequelize = new sequelize_1.Sequelize(config.database, // 데이터베이스 이름
config.username, // 사용자명
config.password, // 비밀번호
{
    host: config.host, // 호스트
    dialect: config.dialect, // 데이터베이스 종류
    port: config.port, // 포트 번호
    timezone: config.timezone,
    logging: config.logging, // 로그 여부
    pool: {
        max: 5, // 최대 연결 수
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    retry: {
        max: 3 // 연결 재시도 최대 횟수
    }
});
// 데이터베이스 연결 확인
sequelize.authenticate()
    .then(() => {
    console.log('Database connection established successfully.');
    // 데이터베이스 동기화 (테이블 생성 및 동기화)
    sequelize.sync()
        .then(() => {
        console.log('Database synchronized successfully.');
    })
        .catch((err) => {
        console.error('Error during database synchronization:', err.message);
    });
})
    .catch((err) => {
    console.error('Unable to connect to the database:', err.message);
});
// Sequelize 객체와 모델을 db 객체에 저장
const db = {};
db.sequelize = sequelize;
db.Sequelize = sequelize_1.Sequelize;
// 각 모델을 다른 키로 할당
db.User = (0, user_1.default)(sequelize);
db.Plant = (0, userPlantInfo_1.default)(sequelize);
db.Species = (0, optimalSpeciesInfo_1.default)(sequelize);
db.Event = (0, eventInfo_1.default)(sequelize);
db.User_Event = (0, userEventInfo_1.default)(sequelize);
db.PlantHistory = (0, plantHistory_1.default)(sequelize);
// 모델 간의 관계 설정
db.User.hasMany(db.Plant, { foreignKey: 'user_id' });
db.Plant.belongsTo(db.User, { foreignKey: 'user_id' });
exports.default = db;
