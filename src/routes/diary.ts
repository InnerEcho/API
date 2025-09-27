import express from 'express';
import { GrowthDiaryController } from '@/controllers/GrowthDiaryController.js';
import { GrowthDiaryService } from '@/services/GrowthDiaryService.js';
import { GrowthDiaryBot } from '@/services/bots/GrowthDiaryBot.js';

const router = express.Router();

// 의존성 주입
const growthDiaryBot = new GrowthDiaryBot();
const growthDiaryService = new GrowthDiaryService(growthDiaryBot);
const growthDiaryController = new GrowthDiaryController(growthDiaryService);

router.get('/month/:user_id/:year_month', growthDiaryController.getDiaryDatesForMonth.bind(growthDiaryController));

router.get(
  '/date/:user_id/:date',
  growthDiaryController.getDiaryByDate.bind(growthDiaryController),
);
router.post(
  '/create',
  growthDiaryController.create.bind(growthDiaryController),
);


export default router;
