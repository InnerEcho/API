import { PlantStateController } from '@/controllers/PlantStateController.js';
import { PlantStateService } from '@/services/PlantStateService.js';
import { verifyTokenV2 } from '@/middlewares/authV2.js';
import express from 'express';

const router = express.Router();

// 의존성 주입
const plantStateService = new PlantStateService();
const plantStateController = new PlantStateController(plantStateService);

/**
 * @swagger
 * /plant/state:
 *   post:
 *     summary: 식물 상태 정보 조회
 *     description: 특정 사용자가 소유한 식물의 현재 상태 정보를 조회합니다. 온도, 조도, 습도의 상태값(높음, 정상, 낮음)과 관련 정보를 반환합니다.
 *     tags:
 *       - 식물 상태
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_name:
 *                 type: string
 *                 description: 식물을 소유한 사용자의 이름
 *                 example: "홍길동"
 *               plant_id:
 *                 type: integer
 *                 description: 조회할 식물의 고유 ID
 *                 example: 1
 *     responses:
 *       200:
 *         description: 식물 상태 정보 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     current_temp:
 *                       type: number
 *                       description: 현재 식물의 온도
 *                       example: 18.5
 *                     current_light:
 *                       type: number
 *                       description: 현재 식물의 조도
 *                       example: 8500
 *                     current_moisture:
 *                       type: number
 *                       description: 현재 식물의 토양 수분
 *                       example: 450
 *                     temp_state:
 *                       type: string
 *                       description: 온도 상태 (높음, 정상, 낮음)
 *                       example: "정상"
 *                     light_state:
 *                       type: string
 *                       description: 조도 상태 (높음, 정상, 낮음)
 *                       example: "높음"
 *                     moisture_state:
 *                       type: string
 *                       description: 토양 수분 상태 (높음, 정상, 낮음)
 *                       example: "낮음"
 *                 msg:
 *                   type: string
 *                   example: "Ok"
 *       404:
 *         description: 해당 식물 상태 데이터를 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 404
 *                 msg:
 *                   type: string
 *                   example: "Not Exits PlantData"
 *       500:
 *         description: 서버 내부 오류가 발생한 경우
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 500
 *                 msg:
 *                   type: string
 *                   example: "ServerError"
 */

router.get(
  '',
  verifyTokenV2,
  plantStateController.getPlantsByUserId.bind(plantStateController),
);

router.get(
  '/state/:plantId',
  verifyTokenV2,
  plantStateController.getPlantState.bind(plantStateController),
);

router.post(
  '/state/:plantId/experience',
  verifyTokenV2,
  plantStateController.gainExperience.bind(plantStateController),
);

router.post(
  '/state/:plantId/likeability',
  verifyTokenV2,
  plantStateController.increaseLikeability.bind(plantStateController),
);

export default router;
