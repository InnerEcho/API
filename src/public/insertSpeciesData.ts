import { type Dialect, Sequelize } from "sequelize";
import SpeciesModel from "../models/species.js"; // 모델 경로 확인
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Sequelize 인스턴스 생성
const sequelize = new Sequelize(
  process.env.DB_NAME || "default_database", // 기본값 지정
  process.env.DB_USER || "default_user",
  process.env.DB_PW || "default_password",
  {
    host: process.env.DB_HOST || "localhost",
    dialect: (process.env.DB_DIALECT || "mysql") as Dialect,
    logging: false,
  }
);

// 모델 초기화
const Species = SpeciesModel(sequelize);

async function insertSpeciesData() {
  try {
    // DB 연결
    await sequelize.authenticate();
    console.log("Connection established successfully.");

    // JSON 파일 읽기
    const filePath = path.resolve(__dirname, "../public/plantdata.json");
    const speciesData = JSON.parse(fs.readFileSync(filePath, "utf-8"));

     // 데이터 삽입
     for (const data of speciesData) {
      // 기존 데이터 확인
      const existingSpecies = await Species.findOne({ where: { species_name: data.species_name } });
      if (existingSpecies) {
        console.log(`Species with name "${data.species_name}" already exists. Skipping.`);
        continue; // 중복된 데이터는 건너뛰기
      }

      // 중복이 없으면 데이터 삽입
      await Species.create(data);
      console.log(`Species "${data.species_name}" successfully added.`);
    }

    console.log("데이터 잘 들어갔다. 걱정마라.");
  } catch (error) {
    console.error("뭔가 문제가 있다. 걱정해라:", error);
  } finally {
    // DB 연결 닫기
    await sequelize.close();
  }
}

insertSpeciesData();
