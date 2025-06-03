import express from 'express';
import { verifyToken } from '@/middlewares/auth.js';
import { UserController } from '@/controllers/UserController.js';
import { UserService } from '@/services/UserService.js';
import { EmotionController } from '@/controllers/EmotionController.js';

const router = express.Router();

// 의존성 주입
const userService = new UserService();
const userController = new UserController(userService);
const emotionController = new EmotionController();

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
router.post('/register', userController.signUp.bind(userController));

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
router.post('/login', userController.signIn.bind(userController));

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
router.post(
  '/email',
  userController.sendEmailVerification.bind(userController),
);

router.post('/emotion', emotionController.getEmotion.bind(emotionController));

// 토큰 검증
router.get('/token', verifyToken, (req, res) => {
  res.json({
    code: 200,
    data: req.body.user,
    msg: 'Ok',
  });
});

router.get('/:user_id', userController.getUserInfo.bind(userController));
router.put('/:user_id', userController.updateUserInfo.bind(userController));
router.delete('/:user_id', userController.deleteUser.bind(userController));

export default router;
