import 'dotenv/config';
import { DbConfig } from "../interface/db.js";
export declare const dbConfig: {
    development: DbConfig;
    test: DbConfig;
    production: DbConfig;
};
