import express from 'express';
import { MissionController } from '@/controllers/MissionController.js';
import { MissionService } from '@/services/MissionService.js';
import upload from '@/middlewares/upload.js';
import { PlantStateService } from '@/services/PlantStateService.js';

const router = express.Router();

// 의존성 주입
// 1. PlantStateService 인스턴스 생성
const plantStateService = new PlantStateService();
// 2. 생성한 인스턴스를 MissionService 생성자에 주입
const missionService = new MissionService(plantStateService);
// 3. MissionController에 missionService 주입
const missionController = new MissionController(missionService);


router.get('/:user_id', missionController.getMissions.bind(missionController));
router.post(
  '/complete',
  missionController.completeMission.bind(missionController),
);
router.post(
  '/drinkwater',
  upload.single('missionImage'), // 'missionImage' 이름으로 파일 받기
  missionController.drinkWater.bind(missionController)
);
router.post(
  '/submitsmile',
  upload.single('smileImage'), // 'smileImage' 이름으로 파일 받기
  missionController.submitSmileImage.bind(missionController)
);
router.post(
  '/chatwithplant',
  missionController.chatWithPlant.bind(missionController)
);
router.post(
  '/completestretching',
  missionController.completeStretching.bind(missionController)
);


export default router;
