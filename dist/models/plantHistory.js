"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const sequelize_1 = require("sequelize");
function default_1(sequelize) {
    // PlantHistory 모델 클래스 정의
    class PlantHistory extends sequelize_1.Model {
        // 다른 모델과의 관계 설정
        static associate(models) {
            // Plant 모델과의 N:1 관계 설정 -> 하나의 식물은 여러개의 히스토리 기록을 가질 수 있음
            PlantHistory.belongsTo(models.Plant, {
                foreignKey: 'plant_id',
                targetKey: 'plant_id',
                onDelete: 'CASCADE' // 식물이 삭제되면 관련 히스토리도 삭제
            });
        }
    }
    // 모델의 스키마 정의
    PlantHistory.init({
        history_id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            comment: "히스토리 ID",
        },
        plant_id: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            comment: "식물 ID",
            references: {
                model: 'plant',
                key: 'plant_id'
            }
        },
        timestamp: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
            comment: "기록 시간",
        },
        temperature: {
            type: sequelize_1.DataTypes.FLOAT,
            allowNull: false,
            comment: "측정된 온도",
        },
        temp_state: {
            type: sequelize_1.DataTypes.STRING(5),
            allowNull: false,
            defaultValue: 'UNKNOWN',
            comment: "온도 상태",
        },
        light_intensity: {
            type: sequelize_1.DataTypes.FLOAT,
            allowNull: false,
            comment: "측정된 조도",
        },
        light_state: {
            type: sequelize_1.DataTypes.STRING(5),
            allowNull: false,
            defaultValue: 'UNKNOWN',
            comment: "조도 상태",
        },
        soil_moisture: {
            type: sequelize_1.DataTypes.FLOAT,
            allowNull: false,
            comment: "측정된 토양수분",
        },
        moisture_state: {
            type: sequelize_1.DataTypes.STRING(5),
            allowNull: false,
            defaultValue: 'UNKNOWN',
            comment: "토양수분 상태",
        }
    }, {
        sequelize,
        tableName: "plant_history",
        timestamps: false, // createdAt, updatedAt 컬럼 사용하지 않음
        indexes: [
            {
                name: "PRIMARY",
                unique: true,
                using: "BTREE",
                fields: [{ name: "history_id" }],
            },
            {
                // 식물ID와 타임스탬프로 조회 성능 향상을 위한 인덱스
                name: "plant_timestamp_idx",
                using: "BTREE",
                fields: [
                    { name: "plant_id" },
                    { name: "timestamp" }
                ],
            }
        ],
    });
    return PlantHistory;
}
