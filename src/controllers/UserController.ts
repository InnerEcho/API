import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import db from '@/models/index.js';
import type { ApiResult } from '@/interface/api.js';
import { UserService } from '@/services/UserService.js';

export class UserController {
  private userService: UserService;

  constructor(userService: UserService) {
    this.userService = userService;
  }

  /**
   * 사용자 회원가입
   */
  public async signUp(req: Request, res: Response): Promise<void> {
    const result: ApiResult = { code: 400, data: null, msg: 'Failed' };

    try {
      const { user_name, user_email, password } = req.body;
      const response = await this.userService.signUp(
        user_name,
        user_email,
        password,
      );

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
  public async signIn(req: Request, res: Response): Promise<void> {
    const result: ApiResult = { code: 400, data: null, msg: 'Failed' };

    try {
      const { user_email, password } = req.body;
      const response = await this.userService.signIn(user_email, password);

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
  public async sendEmailVerification(
    req: Request,
    res: Response,
  ): Promise<void> {
    const apiResult: ApiResult = {
      code: 400,
      data: null,
      msg: '',
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
        pass: process.env.PW,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const randNum = Math.floor(Math.random() * (999999 - 111111 + 1)) + 111111;
    const email = req.body.email;

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: 'Ohgnoy 메일 인증',
      html: `인증번호를 입력해주세요: ${randNum}`,
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

  public async getUserInfo(req: Request, res: Response): Promise<void> {
    const result: ApiResult = { code: 400, data: null, msg: 'Failed' };

    try {
      const { user_id } = req.params;
      const response = await this.userService.getUserInfo(parseInt(user_id));

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

  public async updateUserInfo(req: Request, res: Response): Promise<void> {
    const result: ApiResult = { code: 400, data: null, msg: 'Failed' };

    try {
      const { user_id } = req.params;
      const { user_name, email } = req.body;
      const response = await this.userService.updateUserInfo(
        parseInt(user_id),
        user_name,
        email,
      );

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

  public async deleteUser(req: Request, res: Response): Promise<void> {
    const result: ApiResult = { code: 400, data: null, msg: 'Failed' };

    try {
      const { user_id } = req.params;
      await this.userService.deleteUser(parseInt(user_id));

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
