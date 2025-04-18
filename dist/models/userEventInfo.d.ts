import { Sequelize, Model } from "sequelize";
interface UserEventAttributes {
    user_event_id: BigInt;
    user_id: BigInt;
    event_id: BigInt;
    plant_id: BigInt;
    status: number;
    assigned_at: Date;
    completed_at: Date;
}
export default function (sequelize: Sequelize): import("sequelize").ModelCtor<Model<UserEventAttributes, UserEventAttributes>>;
export {};
