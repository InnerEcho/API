import { Sequelize, Model } from "sequelize";
interface GrowthDiaryAttributes {
    id: BigInt;
    user_id: BigInt;
    title: string;
    content: string;
    image_url?: string;
    created_at: Date;
    updated_at: Date;
    is_deleted: boolean;
    edited: boolean;
}
export default function (sequelize: Sequelize): import("sequelize").ModelCtor<Model<GrowthDiaryAttributes, GrowthDiaryAttributes>>;
export {};
