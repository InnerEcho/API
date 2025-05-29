import type { Request, Response } from 'express';
import type { Sequelize } from 'sequelize';
declare class PlantStateController {
    private sequelize;
    constructor(sequelize: Sequelize);
    /**
     * 🌱 식물 상태 조회
     */
    getPlantState(req: Request, res: Response): Promise<void>;
}
declare const _default: PlantStateController;
export default _default;
