"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const sequelize_1 = require("sequelize");
function default_1(sequelize) {
    // Plant 모델 정의
    const Plant = sequelize.define("plant", {
        plant_id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true, // PRI 키 설정
            autoIncrement: true, // 자동 증가
            allowNull: false,
            comment: "식물 ID",
        },
        user_id: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            comment: "사용자 ID",
            references: {
                model: 'user', // 참조할 테이블
                key: 'user_id', // 참조할 컬럼
            },
            onDelete: "CASCADE", // 유저 삭제 시 해당 식물도 삭제
            onUpdate: "CASCADE", // 유저 ID 변경 시 업데이트
        },
        species_id: {
            type: sequelize_1.DataTypes.INTEGER,
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
            allowNull: true,
            defaultValue: null,
            comment: "식물 이름",
        },
        current_temp: {
            type: sequelize_1.DataTypes.FLOAT,
            allowNull: false,
            comment: "현재 온도",
        },
        temp_state: {
            type: sequelize_1.DataTypes.STRING(10),
            allowNull: false,
            defaultValue: 'UNKNOWN',
            comment: "온도 상태(value: 낮음 | 정상 | 높음)",
        },
        current_light: {
            type: sequelize_1.DataTypes.FLOAT,
            allowNull: false,
            comment: "현재 조도",
        },
        light_state: {
            type: sequelize_1.DataTypes.STRING(10),
            allowNull: false,
            defaultValue: 'UNKNOWN',
            comment: "조도 상태(value: 낮음 | 정상 | 높음)",
        },
        current_moisture: {
            type: sequelize_1.DataTypes.FLOAT,
            allowNull: false,
            comment: "현재 토양수분",
        },
        moisture_state: {
            type: sequelize_1.DataTypes.STRING(10),
            allowNull: false,
            defaultValue: 'UNKNOWN',
            comment: "토양수분 상태(value: 낮음 | 정상 | 높음)",
        },
        watering_cycle: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            comment: "물 주기(일 단위)",
        },
        last_watered_date: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize_1.DataTypes.NOW,
            comment: "마지막으로 물 준 날짜",
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
