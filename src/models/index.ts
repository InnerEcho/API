import { Sequelize, type Dialect } from 'sequelize';

import { dbConfig } from '@/config/db.config.js';
import userDb from './user.js'; // 모델 파일 import
import userPlantInfoDb from './userPlant.js';
import optimalSpeciesInfoDb from './species.js';
import eventDb from './eventInfo.js';
import userEventInfoDb from './userEvent.js';
import chatHistoryDb from './chatHistory.js';
import GrowthDiary from './GrowthDiary.js';
import GrowthDiaryComment from './GrowthDiaryComment.js';
import userFriendsDb from "./userFriends.js";
import RefreshTokenDb from './RefreshToken.js';
import TokenBlacklistDb from './TokenBlacklist.js';
import missionDb from './mission.js';
import userMissionDb from './user_mission.js';
import chatAnalysisDb from './chatAnalysis.js';

// 현재 환경을 가져옴 (development, test, production)
const env = process.env.NODE_ENV || 'development';
const config = dbConfig[env as keyof typeof dbConfig];

// Sequelize 인스턴스 생성
const sequelize = new Sequelize(
  config.database, // 데이터베이스 이름
  config.username, // 사용자명
  config.password, // 비밀번호
  {
    host: config.host, // 호스트 ('db')
    dialect: config.dialect as Dialect,
    port: config.port,
    logging: false, // 프로덕션에서는 false 권장
  },
);

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
db.ChatHistory = chatHistoryDb(sequelize);
db.GrowthDiary = GrowthDiary(sequelize);
db.GrowthDiaryComment = GrowthDiaryComment(sequelize);
db.UserFriends = userFriendsDb(sequelize);
db.RefreshToken = RefreshTokenDb(sequelize);
db.TokenBlacklist = TokenBlacklistDb(sequelize);
db.Mission = missionDb(sequelize);
db.UserMission = userMissionDb(sequelize);
db.ChatAnalysis = chatAnalysisDb(sequelize);

// 모델 간의 관계 설정
db.User.hasMany(db.Plant, { foreignKey: 'user_id', as: 'plants' });
db.Plant.belongsTo(db.User, { foreignKey: 'user_id', as: 'user' });

db.Species.hasMany(db.Plant, { foreignKey: 'species_id', as: 'plants' });
db.Plant.belongsTo(db.Species, { foreignKey: 'species_id', as: 'species' });

// RefreshToken - User 관계
db.User.hasMany(db.RefreshToken, { foreignKey: 'user_id', onDelete: 'CASCADE' });
db.RefreshToken.belongsTo(db.User, { foreignKey: 'user_id' });

// Mission - UserMission 관계
db.Mission.hasMany(db.UserMission, {
  foreignKey: 'mission_id',
  as: 'userMissions',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
db.UserMission.belongsTo(db.Mission, {
  foreignKey: 'mission_id',
  as: 'mission',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

// User - UserMission 관계
db.User.hasMany(db.UserMission, {
  foreignKey: 'user_id',
  as: 'missions',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
db.UserMission.belongsTo(db.User, {
  foreignKey: 'user_id',
  as: 'user',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

db.ChatHistory.hasOne(db.ChatAnalysis, {
  foreignKey: 'history_id',
  as: 'analysis',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
db.ChatAnalysis.belongsTo(db.ChatHistory, {
  foreignKey: 'history_id',
  as: 'history',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

export default db;
