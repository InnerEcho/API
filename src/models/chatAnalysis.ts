import { Sequelize, DataTypes, Model, type Optional } from 'sequelize';

interface ChatAnalysisAttributes {
  analysis_id: number;
  history_id: number;
  emotion: string | null;
  factor: string | null;
  created_at: Date;
}

type ChatAnalysisCreationAttributes = Optional<
  ChatAnalysisAttributes,
  'analysis_id' | 'emotion' | 'factor' | 'created_at'
>;

export default function (sequelize: Sequelize) {
  class ChatAnalysis
    extends Model<ChatAnalysisAttributes, ChatAnalysisCreationAttributes>
    implements ChatAnalysisAttributes
  {
    declare analysis_id: number;
    declare history_id: number;
    declare emotion: string | null;
    declare factor: string | null;
    declare created_at: Date;
  }

  ChatAnalysis.init(
    {
      analysis_id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
        comment: '분석 레코드 ID (PK)',
      },
      history_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'plant_history',
          key: 'history_id',
        },
        onDelete: 'CASCADE',
        comment: '연결된 대화 히스토리 ID',
      },
      emotion: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '감정 분석 결과',
      },
      factor: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '추출된 주요 요인/하이라이트',
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: '분석 기록 생성 시간',
      },
    },
    {
      sequelize,
      tableName: 'chat_analysis',
      timestamps: false,
      indexes: [
        {
          unique: true,
          name: 'chat_analysis_history_unique',
          fields: ['history_id'],
        },
        {
          name: 'chat_analysis_emotion_idx',
          fields: ['emotion'],
        },
      ],
    },
  );

  return ChatAnalysis;
}
