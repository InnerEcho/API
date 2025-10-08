import { Sequelize, DataTypes, Model } from 'sequelize';

// TokenBlacklist 속성 인터페이스 정의
interface TokenBlacklistAttributes {
  blacklist_id: number;
  token: string;
  expires_at: Date;
  created_at: Date;
  reason?: string;
}

// 모델 반환 타입 정의
export default function (sequelize: Sequelize) {
  return sequelize.define<Model<TokenBlacklistAttributes>>(
    'token_blacklist',
    {
      blacklist_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        comment: 'Blacklist ID (Primary Key)',
      },
      token: {
        type: DataTypes.STRING(500),
        allowNull: false,
        comment: '블랙리스트에 추가된 Access Token',
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: '토큰 만료 시간 (자동 삭제 기준)',
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: '블랙리스트 추가 날짜',
      },
      reason: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '블랙리스트 추가 사유 (logout, security 등)',
      },
    },
    {
      tableName: 'token_blacklist',
      timestamps: false,
      comment: '무효화된 Access Token 블랙리스트',
      indexes: [
        {
          name: 'idx_token',
          unique: true,
          fields: ['token'],
        },
        {
          name: 'idx_expires_at',
          fields: ['expires_at'],
        },
      ],
    }
  );
}
