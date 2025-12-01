import express from 'express';
import { GrowthDiaryController } from '@/controllers/growthDiary/GrowthDiaryController.js';
import { GrowthDiaryService } from '@/services/growthDiary/GrowthDiaryService.js';
import { GrowthDiaryBot } from '@/services/bots/GrowthDiaryBot.js';
import { GrowthDiaryCommentController } from '@/controllers/growthDiary/GrowthDiaryCommentController.js';
import { GrowthDiaryCommentService } from '@/services/growthDiary/GrowthDiaryCommentService.js';
import { ChatHistoryService } from '@/services/chat/ChatHistoryService.js';
import { verifyTokenV2 } from '@/middlewares/authV2.js';

const router = express.Router();

// 의존성 주입
const growthDiaryBot = new GrowthDiaryBot();
const chatHistoryService = new ChatHistoryService();
const growthDiaryService = new GrowthDiaryService(growthDiaryBot, chatHistoryService);
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
// 주의: /:diaryId 라우트보다 먼저 배치해야 함
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

// Diary 단일 조회 (댓글 라우트보다 나중에 배치)
router.get(
  '/:diaryId',
  verifyTokenV2,
  growthDiaryController.getDiaryById.bind(growthDiaryController)
);

export default router;
