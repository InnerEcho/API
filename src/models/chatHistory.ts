import { Sequelize, DataTypes, Model, Optional } from "sequelize";

interface ChatHistoryAttributes {
  history_id: number;
  message: string;
  user_id: number;
  plant_id: number;
  send_date: Date;
  user_type: 'User' | 'Bot';
}

interface ChatHistoryCreationAttributes extends Optional<ChatHistoryAttributes, 'history_id'> {}

export default function (sequelize: Sequelize) {
  class ChatHistory extends Model<ChatHistoryAttributes, ChatHistoryCreationAttributes> {
    static associate(models: any) {
      ChatHistory.belongsTo(models.Plant, {
        foreignKey: 'plant_id',
        targetKey: 'plant_id',
        onDelete: 'CASCADE'
      });
    }
  }

  ChatHistory.init(
    {
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
        references: {
          model: 'user',
          key: 'user_id',
        },
        comment: "사용자 ID",
      },
      plant_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'plant',
          key: 'plant_id',
        },
        comment: "식물 ID",
      },
      send_date: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: "기록 시간",
      },
      user_type: {
        type: DataTypes.ENUM('User', 'Bot'),
        allowNull: false,
        defaultValue: 'User',
        comment: "히스토리 기록 주체 (User 또는 Bot)",
      },
    },
    {
      sequelize,
      tableName: "plant_history", // 실제 테이블 이름이 이게 맞으면 OK
      timestamps: false,
      indexes: [
        {
          name: "plant_send_date_idx",
          using: "BTREE",
          fields: [{ name: "plant_id" }, { name: "send_date" }],
        },
        {
          name: "user_send_date_idx",
          using: "BTREE",
          fields: [{ name: "user_id" }, { name: "send_date" }],
        },
      ],
    }
  );

  return ChatHistory;
}

