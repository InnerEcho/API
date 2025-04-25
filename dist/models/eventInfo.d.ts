import { Sequelize, Model } from "sequelize";
interface EventAttributes {
    event_id: BigInt;
    event_title: string;
    event_content: string;
    update_at: Date;
}
export default function (sequelize: Sequelize): import("sequelize").ModelCtor<Model<EventAttributes, EventAttributes>>;
export {};
