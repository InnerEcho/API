import type { Request, Response } from 'express';
import type { ApiResult } from '@/interface/api.js';
import { GrowthDiaryCommentService } from '@/services/GrowthDiaryCommentService.js';

class GrowthDiaryCommentController {
  private growthDiaryCommentService: GrowthDiaryCommentService;

  constructor(growthDiaryCommentService: GrowthDiaryCommentService) {
    this.growthDiaryCommentService = growthDiaryCommentService;
  }

  public getComments = async (req: Request, res: Response): Promise<void> => {
    const result: ApiResult = { code: 400, data: null, msg: 'Failed' };

    try {
      const { user_id, diary_id } = req.body;
      const response = await this.growthDiaryCommentService.getComments(
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
  };

  public create = async (req: Request, res: Response): Promise<void> => {
    const result: ApiResult = { code: 400, data: null, msg: 'Failed' };

    try {
      const { content, user_id, diary_id } = req.body;
      const response = await this.growthDiaryCommentService.createComment(
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
  };

  public update = async (req: Request, res: Response): Promise<void> => {
    const result: ApiResult = { code: 400, data: null, msg: 'Failed' };

    try {
      const { content, user_id, diary_id, comment_id } = req.body;
      const response = await this.growthDiaryCommentService.updateComment(
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
  };

  public delete = async (req: Request, res: Response): Promise<void> => {
    const result: ApiResult = { code: 400, data: null, msg: 'Failed' };

    try {
      const { user_id, diary_id, comment_id } = req.body;
      const response = await this.growthDiaryCommentService.deleteComment(
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
  };
}

export default new GrowthDiaryCommentController(
  new GrowthDiaryCommentService(),
);
