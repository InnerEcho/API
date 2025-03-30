import { Sequelize, Model, Optional } from "sequelize";
interface SpeciesAttributes {
    species_id: BigInt;
    species_name: string;
    max_temp: number;
    min_temp: number;
    max_light: number;
    min_light: number;
    max_moisture: number;
    min_moisture: number;
    opt_watering: number;
}
interface SpeciesCreationAttributes extends Optional<SpeciesAttributes, 'species_id'> {
}
export default function (sequelize: Sequelize): import("sequelize").ModelCtor<Model<SpeciesAttributes, SpeciesCreationAttributes>>;
export {};
