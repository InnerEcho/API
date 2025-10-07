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
      // 토큰에서 user_id 추출
      if (!req.user) {
        result.code = 401;
        result.msg = 'Authentication required';
        res.status(401).json(result);
        return;
      }
      const user_id = req.user.user_id;

      // URL에서 diary_id 추출 (REST 규격)
      const { diary_id } = req.params;
      const { content } = req.body;

      if (!content || !diary_id) {
        result.code = 400;
        result.msg = 'Missing required fields';
        res.status(400).json(result);
        return;
      }

      const response = await this.growthDiaryCommentService.createComment(
        content,
        user_id,
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

  public async getComments(req: Request, res: Response): Promise<void> {
    const result: ApiResult = { code: 400, data: null, msg: 'Failed' };

    try {
      // 토큰에서 user_id 추출
      if (!req.user) {
        result.code = 401;
        result.msg = 'Authentication required';
        res.status(401).json(result);
        return;
      }
      const user_id = req.user.user_id;

      const { diary_id } = req.params;
      const response = await this.growthDiaryCommentService.getComments(
        user_id,
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
      // 토큰에서 user_id 추출
      if (!req.user) {
        result.code = 401;
        result.msg = 'Authentication required';
        res.status(401).json(result);
        return;
      }
      const user_id = req.user.user_id;

      // URL에서 diary_id와 comment_id 추출 (REST 규격)
      const { diary_id, comment_id } = req.params;

      if (!diary_id || !comment_id) {
        result.code = 400;
        result.msg = 'Missing required parameters';
        res.status(400).json(result);
        return;
      }

      await this.growthDiaryCommentService.deleteComment(
        user_id,
        parseInt(diary_id),
        parseInt(comment_id),
      );

      result.code = 200;
      result.msg = 'Ok';
      res.status(200).json(result);
    } catch (err: any) {
      console.error(err);
      if (err.message === 'Comment not found') {
        result.code = 404;
        result.msg = 'Comment not found';
        res.status(404).json(result);
      } else {
        result.code = 500;
        result.msg = 'ServerError';
        res.status(500).json(result);
      }
    }
  }

  public async update(req: Request, res: Response): Promise<void> {
    const result: ApiResult = { code: 400, data: null, msg: 'Failed' };

    try {
      // 토큰에서 user_id 추출
      if (!req.user) {
        result.code = 401;
        result.msg = 'Authentication required';
        res.status(401).json(result);
        return;
      }
      const user_id = req.user.user_id;

      // URL에서 diary_id와 comment_id 추출 (REST 규격)
      const { diary_id, comment_id } = req.params;
      const { content } = req.body;

      if (!diary_id || !comment_id || !content) {
        result.code = 400;
        result.msg = 'Missing required fields';
        res.status(400).json(result);
        return;
      }

      const response = await this.growthDiaryCommentService.updateComment(
        content,
        user_id,
        parseInt(diary_id),
        parseInt(comment_id),
      );

      result.code = 200;
      result.data = response;
      result.msg = 'Ok';
      res.status(200).json(result);
    } catch (err: any) {
      console.error(err);
      if (err.message === 'Comment not found') {
        result.code = 404;
        result.msg = 'Comment not found';
        res.status(404).json(result);
      } else {
        result.code = 500;
        result.msg = 'ServerError';
        res.status(500).json(result);
      }
    }
  }
}
