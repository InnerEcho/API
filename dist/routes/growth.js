import express from 'express';
import GrowthDiaryController from '../controllers/GrowthDiaryController.js';
const router = express.Router();
router.post('/create', GrowthDiaryController.create);
export default router;
