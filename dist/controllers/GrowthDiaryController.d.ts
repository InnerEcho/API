import { Request, Response } from 'express';
declare class GrowthDiaryController {
    /**
     * 🌱 식물 챗봇과의 대화 처리
     */
    create(req: Request, res: Response): Promise<void>;
}
declare const _default: GrowthDiaryController;
export default _default;
