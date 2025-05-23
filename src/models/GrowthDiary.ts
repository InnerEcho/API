import { Sequelize, DataTypes, Model, type Optional } from "sequelize";

interface GrowthDiaryAttributes {
  diary_id: number;
  user_id: number;
  title: string;
  content: string;
  image_url?: string;
  created_at: Date;
  updated_at: Date;
  is_deleted: boolean;
  edited: boolean;
}

interface GrowthDiaryCreationAttributes extends Optional<GrowthDiaryAttributes, 'diary_id' | 'created_at' | 'updated_at'> {}

export default function (sequelize: Sequelize) {
  return sequelize.define<Model<GrowthDiaryAttributes, GrowthDiaryCreationAttributes>>(
    "growth_diary",
    {
      diary_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        comment: "성장일지 ID (Primary Key)",
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        comment: "작성자 사용자 ID (Foreign Key)",
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: "일지 제목",
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: "일지 내용 (챗봇이 자동 작성)",
      },
      image_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: "첨부 이미지 URL",
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: "일지 작성일시",
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: "일지 수정일시",
      },
      is_deleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "삭제 여부 (소프트 삭제)",
      },
      edited: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "수정 여부",
      },
    },
    {
      tableName: "growth_diary",
      timestamps: false,
      comment: "챗봇이 작성한 성장 일지 정보",
    }
  );
}
