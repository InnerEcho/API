import { Sequelize } from 'sequelize';
import { dbConfig } from "../config/db.config.js";
import userDb from "./user.js"; // 모델 파일 import
import userPlantInfoDb from "./userPlantInfo.js";
import optimalSpeciesInfoDb from "./optimalSpeciesInfo.js";
import eventDb from "./eventInfo.js";
import userEventInfoDb from "./userEventInfo.js";
import chatHistoryDb from "./chatHistory.js";
import GrowthDiary from "./GrowthDiary.js";
import GrowthDiaryComment from "./GrowthDiaryComment.js";
import userFriendsDb from "./userFriends.js";

// 현재 환경을 가져옴 (development, test, production)
const env = process.env.NODE_ENV || 'development';
const config = dbConfig[env];

// Sequelize 인스턴스 생성
const sequelize = new Sequelize(config.database,
// 데이터베이스 이름
config.username,
// 사용자명
config.password,
// 비밀번호
{
  host: config.host,
  // 호스트 ('db')
  dialect: config.dialect,
  port: config.port,
  logging: false // 프로덕션에서는 false 권장
});

// Sequelize 객체와 모델을 db 객체에 저장
const db = {};
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

// 모델 간의 관계 설정
db.User.hasMany(db.Plant, {
  foreignKey: 'user_id'
});
db.Plant.belongsTo(db.User, {
  foreignKey: 'user_id'
});
export default db;