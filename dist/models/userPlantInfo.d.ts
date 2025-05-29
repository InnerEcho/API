import { Sequelize, Model } from 'sequelize';
import type { Optional } from 'sequelize';
interface PlantAttributes {
    plant_id: BigInt;
    user_id: BigInt;
    species_id: BigInt;
    nickname: string;
    plant_level: number;
    plant_experience: number;
    plant_hogamdo: number;
    last_measured_date: Date;
}
interface PlantCreationAttributes extends Optional<PlantAttributes, 'plant_id'> {
}
export default function (sequelize: Sequelize): import("sequelize").ModelCtor<Model<PlantAttributes, PlantCreationAttributes>>;
export {};
