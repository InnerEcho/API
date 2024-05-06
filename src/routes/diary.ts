import express from 'express';
import { ApiResult } from '../interface/api.js';
import GrowthDiaryController from '../controllers/GrowthDiaryController.js';
const router = express.Router();

router.post('/create', GrowthDiaryController.create );

export default router;
