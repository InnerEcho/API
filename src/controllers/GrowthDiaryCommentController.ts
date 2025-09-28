import type { Request, Response } from 'express';
import type { ApiResult } from '@/interface/api.js';
import { GrowthDiaryCommentService } from '@/services/GrowthDiaryCommentService.js';

export class GrowthDiaryCommentController {
  private growthDiaryCommentService: GrowthDiaryCommentService;

  constructor(growthDiaryCommentService: GrowthDiaryCommentService) {
    this.growthDiaryCommentService = growthDiaryCommentService;
  }

  public async create(req: Request, res: Response): Promise<void> {
    const result: ApiResult = { code: 400, data: null, msg: 'Failed' };

    try {
      const { user_id, diary_id, content } = req.body;
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
  }

  public async getComments(req: Request, res: Response): Promise<void> {
    const result: ApiResult = { code: 400, data: null, msg: 'Failed' };

    try {
      const { diary_id } = req.params;
      const { user_id } = req.query;
      const response = await this.growthDiaryCommentService.getComments(
        parseInt(user_id as string),
        parseInt(diary_id),
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

  public async delete(req: Request, res: Response): Promise<void> {
    const result: ApiResult = { code: 400, data: null, msg: 'Failed' };

    try {
      const { user_id, diary_id, comment_id } = req.body;
      await this.growthDiaryCommentService.deleteComment(
        user_id,
        diary_id,
        comment_id,
      );

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

  public async update(req: Request, res: Response): Promise<void> {
    const result: ApiResult = { code: 400, data: null, msg: 'Failed' };

    try {
      const { user_id, diary_id, content } = req.body;
      const { comment_id } = req.params;
      const response = await this.growthDiaryCommentService.updateComment(
        content,
        user_id,
        diary_id,
        parseInt(comment_id),
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
