import { DataTypes, Model } from "sequelize";
export default function (sequelize) {
    // ChatHistory 모델 클래스 정의
    class ChatHistory extends Model {
        // 다른 모델과의 관계 설정
        static associate(models) {
            // Plant 모델과의 N:1 관계 설정 -> 하나의 식물은 여러개의 히스토리 기록을 가질 수 있음
            ChatHistory.belongsTo(models.Plant, {
                foreignKey: 'plant_id',
                targetKey: 'plant_id',
                onDelete: 'CASCADE' // 식물이 삭제되면 관련 히스토리도 삭제
            });
        }
    }
    // 모델의 스키마 정의
    ChatHistory.init({
        history_id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
            comment: "히스토리 ID",
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false,
            comment: "히스토리 내용",
        },
        user_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            comment: "사용자 ID",
            references: {
                model: 'user',
                key: 'user_id'
            }
        },
        plant_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            comment: "식물 ID",
            references: {
                model: 'plant',
                key: 'plant_id'
            }
        },
        send_date: {
            type: DataTypes.DATE,
            allowNull: false,
            comment: "기록 시간",
        },
        user_type: {
            type: DataTypes.ENUM('User', 'Bot'),
            allowNull: false,
            defaultValue: 'user',
            comment: "히스토리 기록 주체 (user 또는 bot)",
        },
    }, {
        sequelize,
        tableName: "plant_history",
        timestamps: false,
        indexes: [
            {
                name: "PRIMARY",
                unique: true,
                using: "BTREE",
                fields: [{ name: "history_id" }],
            },
            {
                name: "plant_timestamp_idx",
                using: "BTREE",
                fields: [{ name: "plant_id" }, { name: "timestamp" }],
            },
            {
                name: "user_timestamp_idx",
                using: "BTREE",
                fields: [{ name: "user_id" }, { name: "timestamp" }],
            }
        ],
    });
    return ChatHistory;
}
