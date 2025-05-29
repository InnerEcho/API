import GrowthDiaryCommentController from '@/controllers/GrowthDiaryCommentController.js';
import express from 'express';

const router = express.Router();

router.post('/list', GrowthDiaryCommentController.getComments);

router.post('/create', GrowthDiaryCommentController.create);

router.post('/update', GrowthDiaryCommentController.update);

router.post('/delete',GrowthDiaryCommentController.delete);

export default router;
