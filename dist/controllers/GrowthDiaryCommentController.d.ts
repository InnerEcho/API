import type { Request, Response } from 'express';
import { GrowthDiaryCommentService } from '@/services/GrowthDiaryCommentService.js';
declare class GrowthDiaryCommentController {
    private growthDiaryCommentService;
    constructor(growthDiaryCommentService: GrowthDiaryCommentService);
    getComments: (req: Request, res: Response) => Promise<void>;
    create: (req: Request, res: Response) => Promise<void>;
    update: (req: Request, res: Response) => Promise<void>;
    delete: (req: Request, res: Response) => Promise<void>;
}
declare const _default: GrowthDiaryCommentController;
export default _default;
