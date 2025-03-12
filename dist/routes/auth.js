"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const auth_2 = require("../controllers/auth");
const router = express_1.default.Router();
/**
 * @swagger
 * /auth/register:
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
router.post("/register", auth_2.registerUser);
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
router.post("/login", auth_2.loginUser);
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
router.post("/email", auth_2.sendEmailVerification);
// 토큰 검증
router.get("/token", auth_1.verifyToken, (req, res) => {
    res.json({
        code: 200,
        data: req.body.user,
        msg: "Ok"
    });
});
exports.default = router;
