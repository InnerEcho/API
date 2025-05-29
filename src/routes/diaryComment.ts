import express from 'express';
import { GrowthDiaryCommentController } from '@/controllers/GrowthDiaryCommentController.js';
import { GrowthDiaryCommentService } from '@/services/GrowthDiaryCommentService.js';

const router = express.Router();

// 의존성 주입
const growthDiaryCommentService = new GrowthDiaryCommentService();
const growthDiaryCommentController = new GrowthDiaryCommentController(
  growthDiaryCommentService,
);

router.post(
  '/create',
  growthDiaryCommentController.create.bind(growthDiaryCommentController),
);
router.get(
  '/:diary_id',
  growthDiaryCommentController.getComments.bind(growthDiaryCommentController),
);
router.delete(
  '/:comment_id',
  growthDiaryCommentController.delete.bind(growthDiaryCommentController),
);

export default router;
