import express from 'express';
import GrowthDiaryController from "../controllers/GrowthDiaryController.js";
const router = express.Router();
router.post('/date', GrowthDiaryController.getDiaryByDate);
router.post('/create', GrowthDiaryController.create);
export default router;