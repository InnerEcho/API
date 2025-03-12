import { Sequelize, Model, Optional } from "sequelize";
interface PlantAttributes {
    plant_id: number;
    user_id: number;
    species_id: number;
    nickname: string;
    current_temp: number;
    temp_state: string;
    current_light: number;
    light_state: string;
    current_moisture: number;
    moisture_state: string;
    watering_cycle: number;
    last_watered_date: Date;
    last_measured_date: Date;
}
interface PlantCreationAttributes extends Optional<PlantAttributes, 'plant_id'> {
}
export default function (sequelize: Sequelize): import("sequelize").ModelCtor<Model<PlantAttributes, PlantCreationAttributes>>;
export {};
