import nodemailer from 'nodemailer';
import { UserService } from "../../services/user/UserService.js";
export class UserController {
  userService;
  constructor(userService) {
    this.userService = userService;
  }

  /**
   * 사용자 회원가입
   */
  async signUp(req, res) {
    const result = {
      code: 400,
      data: null,
      msg: 'Failed'
    };
    try {
      const {
        userName,
        userEmail,
        password,
        userGender
      } = req.body;
      const response = await this.userService.signUp(userName, userEmail, password, userGender);
      result.code = 200;
      result.data = response;
      result.msg = 'Ok';
      res.status(200).json(result);
    } catch (err) {
      console.error(err);
      result.code = 500;
      result.msg = 'ServerError';
      res.status(500).json(result);
    }
  }

  /**
   * 사용자 로그인 처리
   */
  async signIn(req, res) {
    const result = {
      code: 400,
      data: null,
      msg: 'Failed'
    };
    try {
      const {
        userEmail,
        password
      } = req.body;
      const response = await this.userService.signIn(userEmail, password);
      result.code = 200;
      result.data = response;
      result.msg = 'Ok';
      res.status(200).json(result);
    } catch (err) {
      console.error(err);
      result.code = 500;
      result.msg = 'ServerError';
      res.status(500).json(result);
    }
  }

  /**
   * 이메일 인증 코드 발송
   */
  async sendEmailVerification(req, res) {
    const apiResult = {
      code: 400,
      data: null,
      msg: ''
    };
    const smtpTransport = nodemailer.createTransport({
      pool: true,
      maxConnections: 1,
      service: 'naver',
      host: 'smtp.naver.com',
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
      subject: 'Ohgnoy 메일 인증',
      html: `인증번호를 입력해주세요: ${randNum}`
    };
    try {
      await smtpTransport.sendMail(mailOptions);
      apiResult.code = 200;
      apiResult.data = randNum;
      apiResult.msg = 'SendMail';
    } catch (err) {
      apiResult.code = 500;
      apiResult.msg = 'ServerError';
      console.log(err);
    }
    res.json(apiResult);
  }
  async getUserInfo(req, res) {
    const result = {
      code: 400,
      data: null,
      msg: 'Failed'
    };
    try {
      const {
        user_id: userId
      } = req.params;
      const response = await this.userService.getUserInfo(parseInt(userId));
      result.code = 200;
      result.data = response;
      result.msg = 'Ok';
      res.status(200).json(result);
    } catch (err) {
      console.error(err);
      result.code = 500;
      result.msg = 'ServerError';
      res.status(500).json(result);
    }
  }
  async updateUserInfo(req, res) {
    const result = {
      code: 400,
      data: null,
      msg: 'Failed'
    };
    try {
      const {
        user_id: userId
      } = req.params;
      const {
        user_name: userName,
        email
      } = req.body;
      const response = await this.userService.updateUserInfo(parseInt(userId), userName, email);
      result.code = 200;
      result.data = response;
      result.msg = 'Ok';
      res.status(200).json(result);
    } catch (err) {
      console.error(err);
      result.code = 500;
      result.msg = 'ServerError';
      res.status(500).json(result);
    }
  }
  async deleteUser(req, res) {
    const result = {
      code: 400,
      data: null,
      msg: 'Failed'
    };
    try {
      const {
        user_id: userId
      } = req.params;
      await this.userService.deleteUser(parseInt(userId));
      result.code = 200;
      result.msg = 'Ok';
      res.status(200).json(result);
    } catch (err) {
      console.error(err);
      result.code = 500;
      result.msg = 'ServerError';
      res.status(500).json(result);
    }
  }
}

// AuthController 인스턴스 생성
export default new UserController(new UserService());