import { DataTypes } from 'sequelize';

// snake_case ↔ camelCase 매핑: mission_id↔missionId, exp_reward↔expReward, ar_bonus_exp↔arBonusExp, requires_ar_action↔requiresArAction, cooldown_sec↔cooldownSec, is_active↔isActive, created_at↔createdAt, updated_at↔updatedAt

export default function missionModel(sequelize) {
  const Mission = sequelize.define('mission', {
    missionId: {
      field: 'mission_id',
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
      comment: '미션 ID (PK)'
    },
    code: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
      comment: '미션 코드 (UNIQUE)'
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '미션 제목'
    },
    desc: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '미션 설명'
    },
    type: {
      type: DataTypes.ENUM('instant', 'action', 'ar_optional', 'habit'),
      allowNull: false,
      comment: '미션 타입'
    },
    burden: {
      type: DataTypes.TINYINT,
      allowNull: false,
      comment: '부담도'
    },
    expReward: {
      field: 'exp_reward',
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5,
      comment: '경험치 보상'
    },
    arBonusExp: {
      field: 'ar_bonus_exp',
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'AR 보너스 경험치'
    },
    requiresArAction: {
      field: 'requires_ar_action',
      type: DataTypes.ENUM('PET', 'JUMP', 'WATER', 'SUNLIGHT'),
      allowNull: true,
      comment: '필요한 AR 행동'
    },
    cooldownSec: {
      field: 'cooldown_sec',
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '쿨다운 (초)'
    },
    isActive: {
      field: 'is_active',
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '활성 여부'
    },
    createdAt: {
      field: 'created_at',
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '생성 일자'
    },
    updatedAt: {
      field: 'updated_at',
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '수정 일자'
    }
  }, {
    tableName: 'missions',
    timestamps: false
  });
  return Mission;
}