import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '@/models/index.js';

export class UserService {
  public async signUp(
    user_name: string,
    user_email: string,
    password: string,
    user_gender: string,
  ): Promise<any> {
    const existEmail = await db.User.findOne({ where: { user_email: user_email } });
    const existNickName = await db.User.findOne({
      where: { user_name: user_name },
    });

    if (existEmail) {
      throw new Error('ExistEmail');
    } else if (existNickName) {
      throw new Error('ExistNickName');
    }

    const entryPassword = await bcrypt.hash(password, 12);
    const entryUser = {
      user_name: user_name,
      user_email: user_email,
      password: entryPassword,
      user_gender: user_gender,
    };

    const registedUser = await db.User.create(entryUser);
    const entryPlant = {
      user_id: registedUser.user_id,
      species_id: 1,
      nickname: '금쪽이',
      plant_level: 1,
      plant_experience: 0,
      plant_hogamdo: 0,
      last_measured_date: new Date(),
    };
    await db.Plant.create(entryPlant);

    registedUser.password = ''; // 비밀번호 숨김 처리
    return registedUser;
  }

  public async signIn(user_email: string, password: string): Promise<string> {
    const dbUser = await db.User.findOne({ where: { user_email: user_email } });

    if (!dbUser) {
      throw new Error('NotExistEmail');
    }

    const comparePassword = await bcrypt.compare(password, dbUser.password);
    if (!comparePassword) {
      throw new Error('IncorrectPassword');
    }

    const dbPlant = await db.sequelize.query(
      `
      SELECT p.plant_id, p.nickname
      FROM user u, plant p
      WHERE u.user_id = p.user_id AND u.user_id = ${dbUser.user_id};
    `,
      {
        type: db.Sequelize.QueryTypes.SELECT,
      },
    );

    const tokenData = {
      user_id: dbUser.user_id,
      user_email: dbUser.user_email,
      user_name: dbUser.user_name,
      state: dbUser.state,
      plant_id: dbPlant[0]?.plant_id || null,
      nickname: dbPlant[0]?.nickname || null,
    };

    return jwt.sign(tokenData, process.env.JWT_AUTH_KEY as string, {
      expiresIn: '24h',
      issuer: 'InnerEcho',
    });
  }

  public async getUserInfo(user_id: number): Promise<any> {
    const user = await db.User.findOne({
      where: { user_id: user_id },
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      throw new Error('UserNotFound');
    }

    return user;
  }

  public async updateUserInfo(
    user_id: number,
    user_name: string,
    user_email: string,
  ): Promise<any> {
    const user = await db.User.findOne({ where: { user_id: user_id } });

    if (!user) {
      throw new Error('UserNotFound');
    }

    const updatedUser = await user.update({
      user_name: user_name,
      user_email: user_email,
    });

    updatedUser.password = ''; // 비밀번호 숨김 처리
    return updatedUser;
  }

  public async deleteUser(user_id: number): Promise<void> {
    const user = await db.User.findOne({ where: { user_id: user_id } });

    if (!user) {
      throw new Error('UserNotFound');
    }

    await user.destroy();
  }
}
