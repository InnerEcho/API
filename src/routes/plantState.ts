import express from 'express';
import { PlantStateController } from '@/controllers/PlantStateController.js';
import { PlantStateService } from '@/services/PlantStateService.js';

const router = express.Router();

// 의존성 주입
const plantStateService = new PlantStateService();
const plantStateController = new PlantStateController(plantStateService);

router.get(
  '/:plant_id',
  plantStateController.getPlantState.bind(plantStateController),
);
router.put(
  '/:plant_id',
  plantStateController.updatePlantState.bind(plantStateController),
);

export default router;
