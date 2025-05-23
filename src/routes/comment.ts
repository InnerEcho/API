import GrowthDiaryCommentController from '../controllers/GrowthDiaryCommentController.js';
import express from 'express';

const router = express.Router();

router.post('', GrowthDiaryCommentController.getComments);

router.post('/create', GrowthDiaryCommentController.create);

router.post('/update', GrowthDiaryCommentController.update);

export default router;
