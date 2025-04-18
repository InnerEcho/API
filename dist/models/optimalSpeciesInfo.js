"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const sequelize_1 = require("sequelize");
function default_1(sequelize) {
    // Species 모델 정의
    const Species = sequelize.define("species", {
        species_id: {
            type: sequelize_1.DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
            comment: "식물 종 ID"
        },
        species_name: {
            type: sequelize_1.DataTypes.STRING(50),
            allowNull: false,
            comment: "종 이름",
        },
        max_temp: {
            type: sequelize_1.DataTypes.FLOAT,
            allowNull: false,
            comment: "최대 온도",
        },
        min_temp: {
            type: sequelize_1.DataTypes.FLOAT,
            allowNull: false,
            comment: "최소 온도",
        },
        max_light: {
            type: sequelize_1.DataTypes.FLOAT,
            allowNull: false,
            comment: "최대 조도",
        },
        min_light: {
            type: sequelize_1.DataTypes.FLOAT,
            allowNull: false,
            comment: "최소 조도",
        },
        max_moisture: {
            type: sequelize_1.DataTypes.FLOAT,
            allowNull: false,
            comment: "적정 토양 수분",
        },
        min_moisture: {
            type: sequelize_1.DataTypes.FLOAT,
            allowNull: false,
            comment: "적정 토양 수분",
        },
        opt_watering: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            comment: "물주기",
        }
    }, {
        tableName: "species",
        timestamps: false, // createdAt, updatedAt 컬럼 사용하지 않음
        comment: "식물 종 정보",
        indexes: [
            {
                name: "species_name_unique", // 유니크 인덱스 이름
                unique: true, // 인덱스를 유니크로 설정
                fields: ["species_name"], // 인덱스를 적용할 필드
            },
        ]
    });
    return Species;
}
