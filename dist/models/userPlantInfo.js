"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const sequelize_1 = require("sequelize");
function default_1(sequelize) {
    // Plant 모델 정의
    const Plant = sequelize.define("plant", {
        plant_id: {
            type: sequelize_1.DataTypes.BIGINT,
            primaryKey: true, // PRI 키 설정
            autoIncrement: true, // 자동 증가
            allowNull: false,
            comment: "식물 ID",
        },
        user_id: {
            type: sequelize_1.DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'user', // 참조할 테이블
                key: 'user_id', // 참조할 컬럼
            },
            onDelete: "CASCADE", // 유저 삭제 시 해당 식물도 삭제
            onUpdate: "CASCADE", // 유저 ID 변경 시 업데이트
            comment: "유저 ID",
        },
        species_id: {
            type: sequelize_1.DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'species', // 참조할 테이블
                key: 'species_id', // 참조할 컬럼
            },
            onDelete: "CASCADE", // 종 삭제 시 해당 데이터도 삭제
            onUpdate: "CASCADE", // 종 정보 변경 시 업데이트
            comment: "식물 종 ID",
        },
        nickname: {
            type: sequelize_1.DataTypes.STRING(50),
            allowNull: false,
            comment: "식물 이름",
        },
        plant_level: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            comment: "식물 레벨",
        },
        plant_experience: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            comment: "식물 경험치",
        },
        plant_hogamdo: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            comment: "식물 호감도도",
        },
        last_measured_date: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize_1.DataTypes.NOW,
            comment: "최신 데이터 측정 시간",
        },
    }, {
        tableName: "plant", // 테이블 이름
        timestamps: false, // createdAt, updatedAt 자동 생성 비활성화
        comment: "유저가 키우는 식물 정보", // 테이블 설명
    });
    return Plant;
}
