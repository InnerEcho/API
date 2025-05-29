// PlantData 인터페이스 정의

export class PlantStateController {
  constructor(plantStateService) {
    this.plantStateService = plantStateService;
  }

  /**
   * 🌱 식물 상태 조회
   */
  async getPlantState(req, res) {
    const result = {
      code: 400,
      data: null,
      msg: 'Failed'
    };
    try {
      const {
        plant_id
      } = req.params;
      const response = await this.plantStateService.getPlantState(parseInt(plant_id));
      result.code = 200;
      result.data = response;
      result.msg = 'Ok';
      res.status(200).json(result);
    } catch (err) {
      console.error(err);
      result.code = 500;
      result.msg = 'ServerError';
      res.status(500).json(result);
    }
  }
  async updatePlantState(req, res) {
    const result = {
      code: 400,
      data: null,
      msg: 'Failed'
    };
    try {
      const {
        plant_id
      } = req.params;
      const {
        state
      } = req.body;
      const response = await this.plantStateService.updatePlantState(parseInt(plant_id), state);
      result.code = 200;
      result.data = response;
      result.msg = 'Ok';
      res.status(200).json(result);
    } catch (err) {
      console.error(err);
      result.code = 500;
      result.msg = 'ServerError';
      res.status(500).json(result);
    }
  }
}