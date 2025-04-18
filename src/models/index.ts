import { Sequelize, Dialect } from 'sequelize';
import { dbConfig } from '../config/db.config.js';
import userDb from './user.js';  // 모델 파일 import
import userPlantInfoDb from './userPlantInfo.js';
import optimalSpeciesInfoDb from './optimalSpeciesInfo.js';
import eventDb from './eventInfo.js'; 
import userEventInfoDb from './userEventInfo.js';  


// 현재 환경을 가져옴 (development, test, production)
const env = process.env.NODE_ENV || 'development';
const config = dbConfig[env as keyof typeof dbConfig];

// Sequelize 인스턴스 생성
const sequelize = new Sequelize(
  config.database,    // 데이터베이스 이름
  config.username,    // 사용자명
  config.password,    // 비밀번호
  {
    host: config.host,    // 호스트
    dialect: config.dialect as Dialect,    // 데이터베이스 종류
    port: config.port,    // 포트 번호
    timezone: config.timezone,
    logging: config.logging,    // 로그 여부
    pool: {
      max: 5,    // 최대 연결 수
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    retry: {
      max: 3    // 연결 재시도 최대 횟수
    }
  }
);

// 데이터베이스 연결 확인
sequelize.authenticate()
  .then(() => {
    console.log('Database connection established successfully.');
  })
  .catch((err: Error) => {
    console.error('Unable to connect to the database:', err.message);
  });

// Sequelize 객체와 모델을 db 객체에 저장
const db: any = {};

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// 각 모델을 다른 키로 할당
db.User = userDb(sequelize);
db.Plant = userPlantInfoDb(sequelize);
db.Species = optimalSpeciesInfoDb(sequelize);
db.Event = eventDb(sequelize);
db.User_Event = userEventInfoDb(sequelize);

// 모델 간의 관계 설정
db.User.hasMany(db.Plant, { foreignKey: 'user_id' });
db.Plant.belongsTo(db.User, { foreignKey: 'user_id' });

export default db;
