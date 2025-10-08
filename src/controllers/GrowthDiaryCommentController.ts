import type { Request, Response } from 'express';
import type { ApiResult } from '@/interface/index.js';
import { GrowthDiaryCommentService } from '@/services/GrowthDiaryCommentService.js';

export class GrowthDiaryCommentController {
  private growthDiaryCommentService: GrowthDiaryCommentService;

  constructor(growthDiaryCommentService: GrowthDiaryCommentService) {
    this.growthDiaryCommentService = growthDiaryCommentService;
  }

  public async create(req: Request, res: Response): Promise<void> {
    const result: ApiResult = { code: 400, data: null, msg: 'Failed' };

    try {
      const userId = req.user!.userId;

      // URL에서 diaryId 추출 (camelCase 사용)
      const { diaryId } = req.params as unknown as { diaryId: string };
      const { content } = req.body;

      if (!content || !diaryId) {
        result.code = 400;
        result.msg = 'Missing required fields';
        res.status(400).json(result);
        return;
      }

      const response = await this.growthDiaryCommentService.createComment(
        content,
        userId,
        parseInt(diaryId),
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
      const userId = req.user!.userId;

      const { diaryId } = req.params as unknown as { diaryId: string };
      const response = await this.growthDiaryCommentService.getComments(
        userId,
        parseInt(diaryId),
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
      const userId = req.user!.userId;

      // URL에서 diaryId와 commentId 추출 (camelCase 사용)
      const { diaryId, commentId } = req.params as unknown as {
        diaryId: string;
        commentId: string;
      };

      if (!diaryId || !commentId) {
        result.code = 400;
        result.msg = 'Missing required parameters';
        res.status(400).json(result);
        return;
      }

      await this.growthDiaryCommentService.deleteComment(
        userId,
        parseInt(diaryId),
        parseInt(commentId),
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
      const userId = req.user!.userId;

      // URL에서 diary_id와 comment_id 추출 (REST 규격)
      const { diaryId, commentId } = req.params;
      const { content } = req.body;

      if (!diaryId || !commentId || !content) {
        result.code = 400;
        result.msg = 'Missing required fields';
        res.status(400).json(result);
        return;
      }

      const response = await this.growthDiaryCommentService.updateComment(
        content,
        userId,
        parseInt(diaryId),
        parseInt(commentId),
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
