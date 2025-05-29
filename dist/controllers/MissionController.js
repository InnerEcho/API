const MISSION_XP = 10;
export class MissionController {
  constructor(missionService) {
    this.missionService = missionService;
  }
  async getMissions(req, res) {
    const result = {
      code: 400,
      data: null,
      msg: 'Failed'
    };
    try {
      const {
        user_id
      } = req.params;
      const response = await this.missionService.getMissions(parseInt(user_id));
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
  async completeMission(req, res) {
    const result = {
      code: 400,
      data: null,
      msg: 'Failed'
    };
    try {
      const {
        user_id,
        mission_id
      } = req.body;
      const response = await this.missionService.completeMission(user_id, mission_id);
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
  async drinkWater(req, res) {
    const apiResult = {
      code: 400,
      data: null,
      msg: ''
    };
    try {
      //물마시는 이미지 받기
      //물마시는 이미지인지 판단
      //판단 결과 반환
    } catch (err) {
      apiResult.code = 500;
      apiResult.msg = 'ServerError';
      res.status(500).json(apiResult);
    }
  }
  async walk(req, res) {
    const apiResult = {
      code: 400,
      data: null,
      msg: ''
    };
    try {} catch (err) {
      apiResult.code = 500;
      apiResult.msg = 'ServerError';
      res.status(500).json(apiResult);
    }
  }
  async chatWithPlant(req, res) {
    const apiResult = {
      code: 400,
      data: null,
      msg: ''
    };
    try {} catch (err) {
      apiResult.code = 500;
      apiResult.msg = 'ServerError';
      res.status(500).json(apiResult);
    }
  }
  async talkWithPlant(req, res) {
    const apiResult = {
      code: 400,
      data: null,
      msg: ''
    };
    try {} catch (err) {
      apiResult.code = 500;
      apiResult.msg = 'ServerError';
      res.status(500).json(apiResult);
    }
  }
  async submitSmileImage(req, res) {
    const apiResult = {
      code: 400,
      data: null,
      msg: ''
    };
    try {} catch (err) {
      apiResult.code = 500;
      apiResult.msg = 'ServerError';
      res.status(500).json(apiResult);
    }
  }
}