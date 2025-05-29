import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import db from "../models/index.js";
class UserController {
  /**
   * 사용자 회원가입
   */
  async registUser(req, res) {
    const apiResult = {
      code: 400,
      data: null,
      msg: ""
    };
    try {
      const {
        user_name,
        userEmail,
        password,
        user_gender
      } = req.body;
      const existEmail = await db.User.findOne({
        where: {
          user_email: userEmail
        }
      });
      const existNickName = await db.User.findOne({
        where: {
          user_name
        }
      });
      if (existEmail) {
        apiResult.msg = "ExistEmail";
        res.status(400).json(apiResult);
        return;
      } else if (existNickName) {
        apiResult.msg = "ExistNickName";
        res.status(400).json(apiResult);
        return;
      }
      const entryPassword = await bcrypt.hash(password, 12);
      const entryUser = {
        user_name,
        user_email: userEmail,
        password: entryPassword,
        user_gender
      };
      const registedUser = await db.User.create(entryUser);
      const entryPlant = {
        user_id: registedUser.user_id,
        species_id: 1,
        nickname: "금쪽이",
        plant_level: 1,
        plant_experience: 0,
        plant_hogamdo: 0,
        last_measured_date: new Date()
      };
      const registedPlant = await db.Plant.create(entryPlant);
      registedUser.password = ""; // 비밀번호 숨김 처리
      apiResult.code = 200;
      apiResult.data = registedUser;
      apiResult.msg = "Success";
      res.status(200).json(apiResult);
    } catch (err) {
      apiResult.code = 500;
      apiResult.msg = "ServerError";
      console.log(err);
      res.status(500).json(apiResult);
    }
  }

  /**
   * 사용자 로그인 처리
   */
  async loginUser(req, res) {
    const apiResult = {
      code: 400,
      data: null,
      msg: ""
    };
    try {
      const {
        userEmail,
        password
      } = req.body;
      const dbUser = await db.User.findOne({
        where: {
          user_email: userEmail
        }
      });
      if (!dbUser) {
        apiResult.msg = "NotExistEmail";
        apiResult.code = 401;
        res.json(apiResult);
        return;
      }
      const comparePassword = await bcrypt.compare(password, dbUser.password);
      if (!comparePassword) {
        apiResult.msg = "IncorrectPassword";
        apiResult.code = 402;
        res.json(apiResult);
        return;
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
      const token = jwt.sign(tokenData, process.env.JWT_AUTH_KEY, {
        expiresIn: "24h",
        issuer: "InnerEcho"
      });
      console.log(token);
      apiResult.code = 200;
      apiResult.data = token;
      apiResult.msg = "Ok";
      res.status(200).json(apiResult);
    } catch (err) {
      apiResult.code = 500;
      apiResult.msg = "ServerError";
      console.log(err);
      res.status(500).json(apiResult);
    }
  }

  /**
   * 이메일 인증 코드 발송
   */
  async sendEmailVerification(req, res) {
    const apiResult = {
      code: 400,
      data: null,
      msg: ""
    };
    const smtpTransport = nodemailer.createTransport({
      pool: true,
      maxConnections: 1,
      service: "naver",
      host: "smtp.naver.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PW
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    const randNum = Math.floor(Math.random() * (999999 - 111111 + 1)) + 111111;
    const email = req.body.email;
    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Ohgnoy 메일 인증",
      html: `인증번호를 입력해주세요: ${randNum}`
    };
    try {
      await smtpTransport.sendMail(mailOptions);
      apiResult.code = 200;
      apiResult.data = randNum;
      apiResult.msg = "SendMail";
    } catch (err) {
      apiResult.code = 500;
      apiResult.msg = "ServerError";
      console.log(err);
    }
    res.json(apiResult);
  }
}

// AuthController 인스턴스 생성
export default new UserController();