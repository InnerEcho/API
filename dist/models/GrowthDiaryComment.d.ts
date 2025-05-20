import { Sequelize, Model } from "sequelize";
interface GrowthDiaryCommentAttributes {
    id: BigInt;
    diary_id: BigInt;
    user_id: BigInt;
    content: string;
    created_at: Date;
    updated_at: Date;
    is_deleted: boolean;
    edited: boolean;
}
export default function (sequelize: Sequelize): import("sequelize").ModelCtor<Model<GrowthDiaryCommentAttributes, GrowthDiaryCommentAttributes>>;
export {};
