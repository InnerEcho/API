export class GrowthDiaryCommentController {
  constructor(growthDiaryCommentService) {
    this.growthDiaryCommentService = growthDiaryCommentService;
  }
  async create(req, res) {
    const result = {
      code: 400,
      data: null,
      msg: 'Failed'
    };
    try {
      const {
        user_id,
        diary_id,
        content
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
  }
  async getComments(req, res) {
    const result = {
      code: 400,
      data: null,
      msg: 'Failed'
    };
    try {
      const {
        diary_id
      } = req.params;
      const {
        user_id
      } = req.body;
      const response = await this.growthDiaryCommentService.getComments(user_id, parseInt(diary_id));
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
  async delete(req, res) {
    const result = {
      code: 400,
      data: null,
      msg: 'Failed'
    };
    try {
      const {
        comment_id
      } = req.params;
      const {
        user_id,
        diary_id
      } = req.body;
      await this.growthDiaryCommentService.deleteComment(user_id, diary_id, parseInt(comment_id));
      result.code = 200;
      result.msg = 'Ok';
      res.status(200).json(result);
    } catch (err) {
      console.error(err);
      result.code = 500;
      result.msg = 'ServerError';
      res.status(500).json(result);
    }
  }
  async update(req, res) {
    const result = {
      code: 400,
      data: null,
      msg: 'Failed'
    };
    try {
      const {
        user_id,
        diary_id,
        comment_id,
        content
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
  }
}