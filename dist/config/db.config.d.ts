import 'dotenv/config';
import { DbConfig } from "../interface/db";
export declare const dbConfig: {
    development: DbConfig;
    test: DbConfig;
    production: DbConfig;
};
