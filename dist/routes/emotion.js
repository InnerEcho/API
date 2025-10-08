import express from 'express';
import { EmotionController } from "../controllers/EmotionController.js";
import { verifyTokenV2 } from "../middlewares/authV2.js";
const router = express.Router();
const emotionController = new EmotionController();

// 특정 사용자의 감정 정보 조회 (토큰에서 user_id 추출)
router.get('/', verifyTokenV2, emotionController.getEmotion.bind(emotionController));
export default router;