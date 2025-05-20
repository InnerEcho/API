import { Request, Response } from "express";
import { ApiResult } from "../interface/api.js";
import { GrowthDiaryCommentService } from "../services/GrowthDiaryCommentService.js";

export class GrowthDiaryCommentController {

  public async create(req: Request, res: Response): Promise<void> {
    const result: ApiResult = { code: 400, data: null, msg: 'Failed' };

    try {
      const { content, user_id, diary_id } = req.body;
      const growthDiaryCommentService = new GrowthDiaryCommentService();
      const response = await growthDiaryCommentService.createComment(content, user_id, diary_id);

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
