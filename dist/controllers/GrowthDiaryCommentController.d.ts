import { Request, Response } from 'express';
declare class GrowthDiaryCommentController {
    getComments(req: Request, res: Response): Promise<void>;
    create(req: Request, res: Response): Promise<void>;
}
declare const _default: GrowthDiaryCommentController;
export default _default;
