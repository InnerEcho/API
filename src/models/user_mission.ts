import { Sequelize, DataTypes, Model, type Optional } from 'sequelize';

export type UserMissionStatus = 'assigned' | 'complete' | 'skipped' | 'expired';

// snake_case ↔ camelCase 매핑: user_id↔userId, mission_id↔missionId, assigned_at↔assignedAt, completed_at↔completedAt, expires_at↔expiresAt, created_at↔createdAt, updated_at↔updatedAt
export interface UserMissionAttributes {
  id: bigint;
  userId: bigint;
  missionId: bigint;
  status: UserMissionStatus;
  assignedAt: Date;
  completedAt: Date | null;
  expiresAt: Date | null;
  evidence: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export type UserMissionCreationAttributes = Optional<
  UserMissionAttributes,
  'id' | 'status' | 'completedAt' | 'expiresAt' | 'evidence' | 'createdAt' | 'updatedAt'
>;

export default function userMissionModel(sequelize: Sequelize) {
  const UserMission = sequelize.define<Model<UserMissionAttributes, UserMissionCreationAttributes>>('user_mission', {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      comment: '사용자 미션 ID (PK)'
    },
    userId: {
      field: 'user_id',
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: '사용자 ID (FK)'
    },
    missionId: {
      field: 'mission_id',
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: '미션 ID (FK)'
    },
    status: {
      type: DataTypes.ENUM('assigned', 'complete', 'skipped', 'expired'),
      allowNull: false,
      defaultValue: 'assigned',
      comment: '미션 상태'
    },
    assignedAt: {
      field: 'assigned_at',
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '할당 일자'
    },
    completedAt: {
      field: 'completed_at',
      type: DataTypes.DATE,
      allowNull: true,
      comment: '완료 일자'
    },
    expiresAt: {
      field: 'expires_at',
      type: DataTypes.DATE,
      allowNull: true,
      comment: '만료 일자'
    },
    evidence: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '미션 인증 자료 (JSON)'
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
    tableName: 'user_missions',
    timestamps: false,
    indexes: [
      {
        name: 'user_missions_user_id_status_idx',
        fields: ['user_id', 'status']
      },
      {
        name: 'user_missions_mission_id_idx',
        fields: ['mission_id']
      },
      {
        name: 'user_missions_unique_assignment',
        unique: true,
        fields: ['user_id', 'mission_id', 'assigned_at']
      }
    ]
  });

  return UserMission;
}
