import express from 'express';
import { verifyToken } from '../middlewares/auth';
import { registerUser, loginUser, sendEmailVerification } from '../controllers/user';

const router = express.Router();

// 회원가입
router.post("/entry", registerUser);

// 로그인
router.post("/login", loginUser);

// 이메일 인증(아직 설정 미완료)
router.post("/email", sendEmailVerification);

// 토큰 검증
router.get("/token", verifyToken, (req, res) => {
  res.json({
    code: 200,
    data: req.body.user,
    msg: "Ok"
  });
});

export default router;
