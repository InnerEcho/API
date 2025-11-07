import { DataTypes, Model } from 'sequelize';
export default function (sequelize) {
  class ChatAnalysis extends Model {}
  ChatAnalysis.init({
    analysis_id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
      comment: '분석 레코드 ID (PK)'
    },
    history_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'plant_history',
        key: 'history_id'
      },
      onDelete: 'CASCADE',
      comment: '연결된 대화 히스토리 ID'
    },
    emotion: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '감정 분석 결과'
    },
    factor: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '추출된 주요 요인/하이라이트'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '분석 기록 생성 시간'
    }
  }, {
    sequelize,
    tableName: 'chat_analysis',
    timestamps: false,
    indexes: [{
      unique: true,
      name: 'chat_analysis_history_unique',
      fields: ['history_id']
    }, {
      name: 'chat_analysis_emotion_idx',
      fields: ['emotion']
    }]
  });
  return ChatAnalysis;
}