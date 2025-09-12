import express from 'express';
import { MissionController } from "../controllers/MissionController.js";
import { MissionService } from "../services/MissionService.js";
import upload from "../middlewares/upload.js";
const router = express.Router();

// 의존성 주입
const missionService = new MissionService();
const missionController = new MissionController(missionService);
router.get('/:user_id', missionController.getMissions.bind(missionController));
router.post('/complete', missionController.completeMission.bind(missionController));
router.post('/drinkwater', upload.single('missionImage'),
// 'missionImage' 이름으로 파일 받기
missionController.drinkWater.bind(missionController));
router.post('/submitsmile', upload.single('smileImage'),
// 'smileImage' 이름으로 파일 받기
missionController.submitSmileImage.bind(missionController));
router.post('/chatwithplant', missionController.chatWithPlant.bind(missionController));
router.post('/completestretching', missionController.completeStretching.bind(missionController));
export default router;