import { DataTypes } from 'sequelize';

// RefreshToken 속성 인터페이스 정의

// 모델 반환 타입 정의
export default function (sequelize) {
  return sequelize.define('refresh_token', {
    token_id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
      comment: 'Refresh Token ID (Primary Key)'
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: '사용자 ID (Foreign Key)'
    },
    token: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: 'Refresh Token 값'
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '만료 시간'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '생성 날짜'
    },
    ip_address: {
      type: DataTypes.STRING(45),
      // IPv6 지원
      allowNull: true,
      comment: '클라이언트 IP 주소'
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '클라이언트 User-Agent'
    },
    is_revoked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '토큰 무효화 여부'
    }
  }, {
    tableName: 'refresh_token',
    timestamps: false,
    comment: 'Refresh Token 저장 테이블',
    indexes: [{
      name: 'idx_user_id',
      fields: ['user_id']
    }, {
      name: 'idx_token',
      unique: true,
      fields: ['token']
    }, {
      name: 'idx_expires_at',
      fields: ['expires_at']
    }]
  });
}