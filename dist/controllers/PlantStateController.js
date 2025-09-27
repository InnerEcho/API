export class PlantStateController {
  constructor(plantStateService) {
    this.plantStateService = plantStateService;
  }

  /**
   * GET /plant-state/:plant_id
   * 특정 식물의 현재 상태를 조회합니다.
   */
  getPlantState = async (req, res) => {
    // 응답 객체 초기화
    const result = {
      code: 400,
      data: null,
      msg: 'Failed'
    };
    try {
      const plant_id = parseInt(req.params.plant_id, 10);
      if (isNaN(plant_id)) {
        result.code = 400;
        result.msg = 'Invalid plant ID';
        res.status(400).json(result);
        return;
      }
      const plantData = await this.plantStateService.getPlantState(plant_id);

      // 성공 시 응답 형식 통일
      result.code = 200;
      result.msg = 'Ok';
      result.data = plantData;
      res.status(200).json(result);
    } catch (error) {
      console.error('Error in getPlantState:', error);
      // 'Plant not found'와 같이 서비스에서 발생한 특정 에러 처리
      if (error instanceof Error && error.message === 'Plant not found') {
        result.code = 404;
        result.msg = error.message;
        res.status(404).json(result);
      } else {
        // 그 외 서버 에러 처리
        result.code = 500;
        result.msg = 'ServerError';
        res.status(500).json(result);
      }
    }
  };

  /**
   * POST /plant-state/:plant_id/experience
   * 식물에게 경험치를 부여합니다.
   */
  gainExperience = async (req, res) => {
    const result = {
      code: 400,
      data: null,
      msg: 'Failed'
    };
    try {
      const plant_id = parseInt(req.params.plant_id, 10);
      const {
        expGained
      } = req.body;
      if (isNaN(plant_id) || typeof expGained !== 'number' || expGained <= 0) {
        result.code = 400;
        result.msg = 'Invalid input data';
        res.status(400).json(result);
        return;
      }
      const serviceResult = await this.plantStateService.gainExperience(plant_id, expGained);
      result.code = 200;
      result.msg = 'Ok';
      result.data = serviceResult;
      res.status(200).json(result);
    } catch (error) {
      console.error('Error in gainExperience:', error);
      result.code = 500;
      result.msg = 'ServerError';
      res.status(500).json(result);
    }
  };

  /**
   * POST /plant-state/:plant_id/likeability
   * 식물의 호감도를 증가시킵니다.
   */
  increaseLikeability = async (req, res) => {
    const result = {
      code: 400,
      data: null,
      msg: 'Failed'
    };
    try {
      const plant_id = parseInt(req.params.plant_id, 10);
      const {
        amount
      } = req.body;
      if (isNaN(plant_id) || typeof amount !== 'number' || amount <= 0) {
        result.code = 400;
        result.msg = 'Invalid input data';
        res.status(400).json(result);
        return;
      }
      const serviceResult = await this.plantStateService.increaseLikeability(plant_id, amount);
      result.code = 200;
      result.msg = 'Ok';
      result.data = serviceResult;
      res.status(200).json(result);
    } catch (error) {
      console.error('Error in increaseLikeability:', error);
      result.code = 500;
      result.msg = 'ServerError';
      res.status(500).json(result);
    }
  };
}