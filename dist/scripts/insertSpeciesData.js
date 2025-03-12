"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const optimalSpeciesInfo_1 = __importDefault(require("../models/optimalSpeciesInfo")); // 모델 경로 확인
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Sequelize 인스턴스 생성
const sequelize = new sequelize_1.Sequelize(process.env.DB_NAME || "default_database", // 기본값 지정
process.env.DB_USER || "default_user", process.env.DB_PW || "default_password", {
    host: process.env.DB_HOST || "localhost",
    dialect: (process.env.DB_DIALECT || "mysql"),
    logging: false,
});
// 모델 초기화
const Species = (0, optimalSpeciesInfo_1.default)(sequelize);
function insertSpeciesData() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // DB 연결
            yield sequelize.authenticate();
            console.log("Connection established successfully.");
            // JSON 파일 읽기
            const filePath = path_1.default.resolve(__dirname, "../data/plantdata.json");
            const speciesData = JSON.parse(fs_1.default.readFileSync(filePath, "utf-8"));
            // 데이터 삽입
            for (const data of speciesData) {
                // 기존 데이터 확인
                const existingSpecies = yield Species.findOne({ where: { species_name: data.species_name } });
                if (existingSpecies) {
                    console.log(`Species with name "${data.species_name}" already exists. Skipping.`);
                    continue; // 중복된 데이터는 건너뛰기
                }
                // 중복이 없으면 데이터 삽입
                yield Species.create(data);
                console.log(`Species "${data.species_name}" successfully added.`);
            }
            console.log("데이터 잘 들어갔다. 걱정마라.");
        }
        catch (error) {
            console.error("뭔가 문제가 있다. 걱정해라:", error);
        }
        finally {
            // DB 연결 닫기
            yield sequelize.close();
        }
    });
}
insertSpeciesData();
