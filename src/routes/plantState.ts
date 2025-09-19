import express from 'express';
import { PlantStateController } from '@/controllers/PlantStateController.js';
import { PlantStateService } from '@/services/PlantStateService.js';

const router = express.Router();

// 1. 의존성 생성 및 주입
// 서비스 인스턴스를 먼저 생성합니다.
const plantStateService = new PlantStateService();
// 생성한 서비스 인스턴스를 컨트롤러 생성자에 전달합니다.
const plantStateController = new PlantStateController(plantStateService);

// 2. 라우트 설정
// GET /api/plants/:plant_id - 특정 식물 정보 조회
router.get(
  '/:plant_id',
  plantStateController.getPlantState,
);

// POST /api/plants/:plant_id/experience - 경험치 획득
router.post(
  '/:plant_id/experience',
  plantStateController.gainExperience,
);

// POST /api/plants/:plant_id/likeability - 호감도 증가
router.post(
  '/:plant_id/likeability',
  plantStateController.increaseLikeability,
);

export default router;