import { Sequelize, Model } from 'sequelize';
interface UserAttributes {
    user_id: BigInt;
    password: string;
    user_name: string;
    user_gender: string;
    user_email: string;
    phone_number: string;
    state: string;
    birth_date: Date;
    created_at: Date;
}
export default function (sequelize: Sequelize): import("sequelize").ModelCtor<Model<UserAttributes, UserAttributes>>;
export {};
