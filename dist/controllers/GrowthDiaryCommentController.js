import { GrowthDiaryCommentService } from "../services/GrowthDiaryCommentService.js";
class GrowthDiaryCommentController {
  constructor(growthDiaryCommentService) {
    this.growthDiaryCommentService = growthDiaryCommentService;
  }
  getComments = async (req, res) => {
    const result = {
      code: 400,
      data: null,
      msg: 'Failed'
    };
    try {
      const {
        user_id,
        diary_id
      } = req.body;
      const response = await this.growthDiaryCommentService.getComments(user_id, diary_id);
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
  };
  create = async (req, res) => {
    const result = {
      code: 400,
      data: null,
      msg: 'Failed'
    };
    try {
      const {
        content,
        user_id,
        diary_id
      } = req.body;
      const response = await this.growthDiaryCommentService.createComment(content, user_id, diary_id);
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
  };
  update = async (req, res) => {
    const result = {
      code: 400,
      data: null,
      msg: 'Failed'
    };
    try {
      const {
        content,
        user_id,
        diary_id,
        comment_id
      } = req.body;
      const response = await this.growthDiaryCommentService.updateComment(content, user_id, diary_id, comment_id);
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
  };
  delete = async (req, res) => {
    const result = {
      code: 400,
      data: null,
      msg: 'Failed'
    };
    try {
      const {
        user_id,
        diary_id,
        comment_id
      } = req.body;
      const response = await this.growthDiaryCommentService.deleteComment(user_id, diary_id, comment_id);
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
  };
}
export default new GrowthDiaryCommentController(new GrowthDiaryCommentService());