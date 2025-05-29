import { Sequelize, Model, type Optional } from "sequelize";
interface GrowthDiaryAttributes {
    diary_id: number;
    user_id: number;
    title: string;
    content: string;
    image_url?: string;
    created_at: Date;
    updated_at: Date;
    is_deleted: boolean;
    edited: boolean;
}
interface GrowthDiaryCreationAttributes extends Optional<GrowthDiaryAttributes, 'diary_id' | 'created_at' | 'updated_at'> {
}
export default function (sequelize: Sequelize): import("sequelize").ModelCtor<Model<GrowthDiaryAttributes, GrowthDiaryCreationAttributes>>;
export {};
