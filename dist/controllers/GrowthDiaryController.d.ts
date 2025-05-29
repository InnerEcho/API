import type { Request, Response } from 'express';
import { GrowthDiaryService } from '@/services/GrowthDiaryService.js';
declare class GrowthDiaryController {
    private growthDiaryService;
    constructor(growthDiaryService: GrowthDiaryService);
    getDiaryByDate(req: Request, res: Response): Promise<void>;
    /**
     * 🌱 식물 챗봇과의 대화 처리
     * 지금은 openai 한번만 돌리는데 성장일지 작성자 + 성장일지 작성 평가자로 나눠서 작성하는 방식이 좋을듯듯
     */
    create(req: Request, res: Response): Promise<void>;
}
declare const _default: GrowthDiaryController;
export default _default;
