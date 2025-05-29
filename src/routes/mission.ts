import express from 'express';
import { MissionController } from '@/controllers/MissionController.js';
import { MissionService } from '@/services/MissionService.js';

const router = express.Router();

// 의존성 주입
const missionService = new MissionService();
const missionController = new MissionController(missionService);

router.get('/:user_id', missionController.getMissions.bind(missionController));
router.post(
  '/complete',
  missionController.completeMission.bind(missionController),
);

export default router;
