import express from 'express';
import { GrowthDiaryCommentController } from '@/controllers/GrowthDiaryCommentController.js';
import { GrowthDiaryCommentService } from '@/services/GrowthDiaryCommentService.js';

const router = express.Router();

// 의존성 주입
const growthDiaryCommentService = new GrowthDiaryCommentService();
const growthDiaryCommentController = new GrowthDiaryCommentController(
  growthDiaryCommentService,
);

router.get(
  '/:diary_id',
  growthDiaryCommentController.getComments.bind(growthDiaryCommentController),
);
// 댓글 생성 (POST)
router.post(
  '/',
  growthDiaryCommentController.create.bind(growthDiaryCommentController),
);
// 댓글 수정 (PUT)
router.put(
  '/:comment_id',
  growthDiaryCommentController.update.bind(growthDiaryCommentController),
);
// 댓글 삭제 (DELETE)
router.delete(
  '/:comment_id',
  growthDiaryCommentController.delete.bind(growthDiaryCommentController),
);

export default router;
