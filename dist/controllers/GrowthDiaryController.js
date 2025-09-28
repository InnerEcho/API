export class GrowthDiaryController {
  constructor(growthDiaryService) {
    this.growthDiaryService = growthDiaryService;
  }
  async getDiaryDatesForMonth(req, res) {
    const result = {
      code: 400,
      data: null,
      msg: 'Failed'
    };
    try {
      const {
        user_id,
        year_month
      } = req.params;
      if (!user_id || !year_month || !/^\d{4}-\d{2}$/.test(year_month)) {
        result.code = 400;
        result.msg = 'Invalid or missing parameters';
        res.status(400).json(result);
        return;
      }
      const numericUserId = parseInt(user_id, 10);
      const dates = await this.growthDiaryService.getDiaryDatesForMonth(numericUserId, year_month);
      result.code = 200;
      result.msg = 'Ok';
      result.data = {
        dates
      }; // 날짜 리스트 반환
      res.status(200).json(result);
    } catch (err) {
      console.error('Error in getDiaryDatesForMonth:', err);
      result.code = 500;
      result.msg = 'ServerError';
      res.status(500).json(result);
    }
  }
  async getDiaryByDate(req, res) {
    const result = {
      code: 400,
      data: null,
      msg: 'Failed'
    };
    try {
      const {
        user_id,
        date
      } = req.body;
      const response = await this.growthDiaryService.getDiaryByDate(user_id, date);
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

  /**
   * 🌱 식물 챗봇과의 대화 처리
   * 지금은 openai 한번만 돌리는데 성장일지 작성자 + 성장일지 작성 평가자로 나눠서 작성하는 방식이 좋을듯듯
   */
  async create(req, res) {
    const result = {
      code: 400,
      data: null,
      msg: 'Failed'
    };
    try {
      const {
        message,
        user_id,
        plant_id
      } = req.body;
      const response = await this.growthDiaryService.create(user_id, plant_id, message);
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