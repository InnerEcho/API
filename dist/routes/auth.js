import express from 'express';
import { verifyToken } from '../middlewares/auth.js';
import AuthController from '../controllers/auth.js';
const router = express.Router();
/**
 * @swagger
 * /auth/regist:
 *   post:
 *     summary: 사용자 회원가입
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: 회원가입 성공
 *       400:
 *         description: 이메일 또는 닉네임이 이미 존재함
 *       500:
 *         description: 서버 오류
 */
router.post("/regist", AuthController.registUser);
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: 사용자 로그인
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: 로그인 성공, JWT 토큰 발급
 *       400:
 *         description: 이메일 또는 비밀번호가 틀림
 *       500:
 *         description: 서버 오류
 */
router.post("/login", AuthController.loginUser);
/**
 * @swagger
 * /auth/email:
 *   post:
 *     summary: 이메일 인증번호 발송
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: 인증번호 전송 성공
 *       500:
 *         description: 서버 오류
 */
router.post("/email", AuthController.sendEmailVerification);
// 토큰 검증
router.get("/token", verifyToken, (req, res) => {
    res.json({
        code: 200,
        data: req.body.user,
        msg: "Ok"
    });
});
export default router;
