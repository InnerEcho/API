import express from 'express';
import { AuthController } from "../controllers/AuthController.js";
import { verifyTokenV2 } from "../middlewares/authV2.js";
import { loginRateLimiter, apiRateLimiter } from "../middlewares/rateLimiter.js";
const router = express.Router();

// 의존성 주입
const authController = new AuthController();

/**
 * @swagger
 * /auth/v2/register:
 *   post:
 *     summary: 사용자 회원가입 (V2 - Access Token + Refresh Token 발급)
 *     tags: [Auth V2]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *               userName:
 *                 type: string
 *                 example: 홍길동
 *               userGender:
 *                 type: string
 *                 example: male
 *     responses:
 *       201:
 *         description: 회원가입 성공, Access Token 및 Refresh Token 발급
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                   example: 201
 *                 message:
 *                   type: string
 *                   example: Registration successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *                     tokenType:
 *                       type: string
 *                       example: Bearer
 *                     expiresIn:
 *                       type: string
 *                       example: 15m
 *                     user:
 *                       type: object
 *                       properties:
 *                         userId:
 *                           type: number
 *                         userEmail:
 *                           type: string
 *                         userName:
 *                           type: string
 *       400:
 *         description: 이메일이 이미 존재하거나 입력값이 유효하지 않음
 *       429:
 *         description: 회원가입 시도 횟수 초과 (Rate Limit)
 *       500:
 *         description: 서버 오류
 */
router.post('/register', apiRateLimiter, authController.register.bind(authController));

/**
 * @swagger
 * /auth/v2/login:
 *   post:
 *     summary: 사용자 로그인 (V2 - Access Token + Refresh Token)
 *     tags: [Auth V2]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: 로그인 성공, Access Token 및 Refresh Token 발급
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *                     tokenType:
 *                       type: string
 *                       example: Bearer
 *                     expiresIn:
 *                       type: string
 *                       example: 15m
 *       400:
 *         description: 이메일 또는 비밀번호가 틀림
 *       429:
 *         description: 로그인 시도 횟수 초과 (Rate Limit)
 *       500:
 *         description: 서버 오류
 */
router.post('/login', loginRateLimiter, authController.login.bind(authController));

/**
 * @swagger
 * /auth/v2/refresh:
 *   post:
 *     summary: Access Token 갱신
 *     tags: [Auth V2]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh Token
 *     responses:
 *       200:
 *         description: 토큰 갱신 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Token refreshed successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     tokenType:
 *                       type: string
 *                       example: Bearer
 *                     expiresIn:
 *                       type: string
 *                       example: 15m
 *       401:
 *         description: Refresh Token이 만료되었거나 유효하지 않음
 *       500:
 *         description: 서버 오류
 */
router.post('/refresh', apiRateLimiter, authController.refreshToken.bind(authController));

/**
 * @swagger
 * /auth/v2/logout:
 *   post:
 *     summary: 로그아웃 (Access Token + Refresh Token 무효화)
 *     tags: [Auth V2]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh Token (선택사항)
 *     responses:
 *       200:
 *         description: 로그아웃 성공
 *       401:
 *         description: 인증 실패
 *       500:
 *         description: 서버 오류
 */
router.post('/logout', authController.logout.bind(authController));

/**
 * @swagger
 * /auth/v2/verify:
 *   get:
 *     summary: 현재 Access Token 검증
 *     tags: [Auth V2]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 토큰이 유효함
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Token is valid
 *                 data:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: number
 *                     user_email:
 *                       type: string
 *                     user_name:
 *                       type: string
 *                     state:
 *                       type: string
 *                     plant_id:
 *                       type: number
 *                     nickname:
 *                       type: string
 *       401:
 *         description: 토큰이 유효하지 않거나 만료됨
 */
router.get('/verify', verifyTokenV2, authController.verifyToken.bind(authController));

/**
 * @swagger
 * /auth/v2/revoke-all:
 *   post:
 *     summary: 모든 세션 무효화 (강제 로그아웃)
 *     tags: [Auth V2]
 *     security:
 *       - bearerAuth: []
 *     description: 사용자의 모든 Refresh Token을 무효화하여 모든 디바이스에서 강제 로그아웃
 *     responses:
 *       200:
 *         description: 모든 세션 무효화 성공
 *       401:
 *         description: 인증 실패
 *       500:
 *         description: 서버 오류
 */
router.post('/revoke-all', verifyTokenV2, authController.revokeAllSessions.bind(authController));
export default router;