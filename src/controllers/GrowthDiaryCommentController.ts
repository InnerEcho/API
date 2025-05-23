import type { Request, Response } from 'express';
import type { ApiResult } from '@/interface/api.js';
import { GrowthDiaryCommentService } from '@/services/GrowthDiaryCommentService.js';

class GrowthDiaryCommentController {
  public async getComments(req: Request, res: Response): Promise<void> {
    const result: ApiResult = { code: 400, data: null, msg: 'Failed' };

    try {
      const { user_id, diary_id } = req.body;
      const growthDiaryCommentService = new GrowthDiaryCommentService();
      const response = await growthDiaryCommentService.getComments(
        user_id,
        diary_id,
      );

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

  public async create(req: Request, res: Response): Promise<void> {
    const result: ApiResult = { code: 400, data: null, msg: 'Failed' };

    try {
      const { content, user_id, diary_id } = req.body;
      const growthDiaryCommentService = new GrowthDiaryCommentService();
      const response = await growthDiaryCommentService.createComment(
        content,
        user_id,
        diary_id,
      );

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

  public async update(req: Request, res: Response): Promise<void> {
    const result: ApiResult = { code: 400, data: null, msg: 'Failed' };

    try {
      const { content, user_id, diary_id, comment_id } = req.body;
      const growthDiaryCommentService = new GrowthDiaryCommentService();
      const response = await growthDiaryCommentService.updateComment(
        content,
        user_id,
        diary_id,
        comment_id,
      );

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

export default new GrowthDiaryCommentController();
