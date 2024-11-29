import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import db from '../models/index';
import { ApiResult } from 'interface/api';

// 사용자 회원가입
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  const apiResult: ApiResult = {
    code: 400,
    data: null,
    msg: "",
  };

  try {
    const { name, email, password } = req.body;

    const existEmail = await db.User.findOne({ where: { email } });
    const existNickName = await db.User.findOne({ where: { name } });

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
    const entryUser = { name, email, password: entryPassword };

    const registedUser = await db.User.create(entryUser);
    registedUser.password = ""; // 비밀번호는 숨김 처리
    apiResult.code = 200;
    apiResult.data = registedUser;
    apiResult.msg = "Success";

    res.status(200).json(apiResult);
  } catch (err) {
    apiResult.code = 500;
    apiResult.msg = "ServerError";
    res.status(500).json(apiResult);
  }
};


// 로그인 처리
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  const apiResult: ApiResult = {
    code: 400,
    data: null,
    msg: "",
  };

  try {
    const { email, password } = req.body;
    const dbUser = await db.User.findOne({ where: { email } });

    if (!dbUser) {
      apiResult.msg = "NotExistEmail";
      res.status(400).json(apiResult);
      return;
    }

    const comparePassword = await bcrypt.compare(password, dbUser.password);
    if (!comparePassword) {
      apiResult.msg = "IncorrectPassword";
      res.status(400).json(apiResult);
      return;
    }

    const tokenData = {
      email: dbUser.email,
      name: dbUser.name,
      user_id: dbUser.user_id,
    };

    const token = jwt.sign(tokenData, process.env.JWT_AUTH_KEY as string, {
      expiresIn: "24h",
      issuer: "InnerEcho",
    });

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
};

// 이메일 인증
export const sendEmailVerification = async (req: Request, res: Response) => {
  const apiResult:ApiResult = {
    code: 400,
    data: null,
    msg: "",
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
    subject: "Ohgnoy 메일 인증",
    html: `인증번호를 입력해주세요: ${randNum}`,
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
};
