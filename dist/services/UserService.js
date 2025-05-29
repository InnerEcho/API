import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from "../models/index.js";
export class UserService {
  async signUp(userName, email, password) {
    const existEmail = await db.User.findOne({
      where: {
        user_email: email
      }
    });
    const existNickName = await db.User.findOne({
      where: {
        user_name: userName
      }
    });
    if (existEmail) {
      throw new Error('ExistEmail');
    } else if (existNickName) {
      throw new Error('ExistNickName');
    }
    const entryPassword = await bcrypt.hash(password, 12);
    const entryUser = {
      user_name: userName,
      user_email: email,
      password: entryPassword
    };
    const registedUser = await db.User.create(entryUser);
    const entryPlant = {
      user_id: registedUser.user_id,
      species_id: 1,
      nickname: '금쪽이',
      plant_level: 1,
      plant_experience: 0,
      plant_hogamdo: 0,
      last_measured_date: new Date()
    };
    await db.Plant.create(entryPlant);
    registedUser.password = ''; // 비밀번호 숨김 처리
    return registedUser;
  }
  async signIn(email, password) {
    const dbUser = await db.User.findOne({
      where: {
        user_email: email
      }
    });
    if (!dbUser) {
      throw new Error('NotExistEmail');
    }
    const comparePassword = await bcrypt.compare(password, dbUser.password);
    if (!comparePassword) {
      throw new Error('IncorrectPassword');
    }
    const dbPlant = await db.sequelize.query(`
      SELECT p.plant_id, p.nickname
      FROM user u, plant p
      WHERE u.user_id = p.user_id AND u.user_id = ${dbUser.user_id} AND p.plant_id = 1;
    `, {
      type: db.Sequelize.QueryTypes.SELECT
    });
    const tokenData = {
      user_id: dbUser.user_id,
      user_email: dbUser.user_email,
      user_name: dbUser.user_name,
      state: dbUser.state,
      plant_id: dbPlant[0]?.plant_id || null,
      nickname: dbPlant[0]?.nickname || null
    };
    return jwt.sign(tokenData, process.env.JWT_AUTH_KEY, {
      expiresIn: '24h',
      issuer: 'InnerEcho'
    });
  }
  async getUserInfo(userId) {
    const user = await db.User.findOne({
      where: {
        user_id: userId
      },
      attributes: {
        exclude: ['password']
      }
    });
    if (!user) {
      throw new Error('UserNotFound');
    }
    return user;
  }
  async updateUserInfo(userId, userName, email) {
    const user = await db.User.findOne({
      where: {
        user_id: userId
      }
    });
    if (!user) {
      throw new Error('UserNotFound');
    }
    const updatedUser = await user.update({
      user_name: userName,
      user_email: email
    });
    updatedUser.password = ''; // 비밀번호 숨김 처리
    return updatedUser;
  }
  async deleteUser(userId) {
    const user = await db.User.findOne({
      where: {
        user_id: userId
      }
    });
    if (!user) {
      throw new Error('UserNotFound');
    }
    await user.destroy();
  }
}