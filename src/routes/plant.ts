import { getPlantState } from '../controllers/plant';
import express from 'express';

const router = express.Router();

router.get("/current", getPlantState);

export default router;  