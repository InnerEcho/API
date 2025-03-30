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
            type: sequelize_1.DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
            comment: "히스토리 ID",
        },
        content: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: false,
            comment: "히스토리 내용",
        },
        user_id: {
            type: sequelize_1.DataTypes.BIGINT, // 사용자 ID를 INT로 변경
            allowNull: false,
            comment: "사용자 ID (Primary Key)",
            references: {
                model: 'user',
                key: 'user_id'
            }
        },
        plant_id: {
            type: sequelize_1.DataTypes.BIGINT,
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
            },
            {
                // 유저ID와 타임스탬프로 조회 성능 향상을 위한 인덱스
                name: "user_timestamp_idx",
                using: "BTREE",
                fields: [
                    { name: "user_id" },
                    { name: "timestamp" }
                ],
            }
        ],
    });
    return PlantHistory;
}
