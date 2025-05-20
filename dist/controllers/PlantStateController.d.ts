import { Request, Response } from "express";
declare class PlantStateController {
    /**
     * 🌱 식물 상태 조회
     */
    getPlantState(req: Request, res: Response): Promise<void>;
}
declare const _default: PlantStateController;
export default _default;
