import express from 'express';
import { GrowthDiaryController } from '@/controllers/GrowthDiaryController.js';
import { GrowthDiaryService } from '@/services/GrowthDiaryService.js';
import { GrowthDiaryBot } from '@/services/bots/GrowthDiaryBot.js';
import { GrowthDiaryCommentController } from '@/controllers/GrowthDiaryCommentController.js';
import { GrowthDiaryCommentService } from '@/services/GrowthDiaryCommentService.js';
import { verifyTokenV2 } from '@/middlewares/authV2.js';

const router = express.Router();

// 의존성 주입
const growthDiaryBot = new GrowthDiaryBot();
const growthDiaryService = new GrowthDiaryService(growthDiaryBot);
const growthDiaryController = new GrowthDiaryController(growthDiaryService);

const growthDiaryCommentService = new GrowthDiaryCommentService();
const growthDiaryCommentController = new GrowthDiaryCommentController(
  growthDiaryCommentService,
);

// Diary routes
router.get(
  '/month/:yearMonth',
  verifyTokenV2,
  growthDiaryController.getDiaryDatesForMonth.bind(growthDiaryController)
);

router.get(
  '/date/:date',
  verifyTokenV2,
  growthDiaryController.getDiaryByDate.bind(growthDiaryController),
);

router.post(
  '/create',
  verifyTokenV2,
  growthDiaryController.create.bind(growthDiaryController),
);

// Comment routes (댓글은 일기의 하위 리소스)
router.get(
  '/:diaryId/comments',
  verifyTokenV2,
  growthDiaryCommentController.getComments.bind(growthDiaryCommentController)
);

router.post(
  '/:diaryId/comments',
  verifyTokenV2,
  growthDiaryCommentController.create.bind(growthDiaryCommentController)
);

router.put(
  '/:diaryId/comments/:commentId',
  verifyTokenV2,
  growthDiaryCommentController.update.bind(growthDiaryCommentController)
);

router.delete(
  '/:diaryId/comments/:commentId',
  verifyTokenV2,
  growthDiaryCommentController.delete.bind(growthDiaryCommentController)
);

export default router;
