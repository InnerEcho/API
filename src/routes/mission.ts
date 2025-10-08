import express from 'express';
import { MissionController } from '@/controllers/MissionController.js';
import { MissionService } from '@/services/MissionService.js';
import upload from '@/middlewares/upload.js';
import { PlantStateService } from '@/services/PlantStateService.js';
import { verifyTokenV2 } from '@/middlewares/authV2.js';

const router = express.Router();

// 의존성 주입
// 1. PlantStateService 인스턴스 생성
const plantStateService = new PlantStateService();
// 2. 생성한 인스턴스를 MissionService 생성자에 주입
const missionService = new MissionService(plantStateService);
// 3. MissionController에 missionService 주입
const missionController = new MissionController(missionService);

router.get(
  '/',
  verifyTokenV2,
  missionController.getMissions.bind(missionController)
);

router.post(
  '/complete',
  verifyTokenV2,
  missionController.completeMission.bind(missionController),
);

router.post(
  '/drinkwater',
  verifyTokenV2,
  upload.single('missionImage'),
  missionController.drinkWater.bind(missionController)
);

router.post(
  '/submitsmile',
  verifyTokenV2,
  upload.single('smileImage'),
  missionController.submitSmileImage.bind(missionController)
);

router.post(
  '/chatwithplant',
  verifyTokenV2,
  missionController.chatWithPlant.bind(missionController)
);

router.post(
  '/completestretching',
  verifyTokenV2,
  missionController.completeStretching.bind(missionController)
);


export default router;
