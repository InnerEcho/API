import { Router } from 'express';
import { recommend, getToday, complete, assignByCodes, clearToday } from "../controllers/mission/MissionController.js";
import { verifyTokenV2 } from "../middlewares/authV2.js";
const router = Router();
router.use(verifyTokenV2);

// GET /missions/recommend?n=2
router.get('/recommend', recommend);

// POST /missions/assign
router.post('/assign', assignByCodes);

// GET /missions/today
router.get('/today', getToday);

// DELETE /missions/today
router.delete('/today', clearToday);

// POST /missions/:id/complete
router.post('/:id/complete', complete);
export default router;