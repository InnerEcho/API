import { DataTypes } from "sequelize";

// 인터페이스 정의 - 모델에서 사용할 속성 정의

// 모델 반환 타입 정의
export default function (sequelize) {
  return sequelize.define("user_friends", {
    friend_id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
      comment: "고유 ID (Primary Key)"
    },
    user_email: {
      type: DataTypes.STRING(254),
      allowNull: false,
      comment: "친구 요청을 보낸 사용자 이메일 (FK → Users.user_email)",
      references: {
        model: 'user',
        // 참조할 테이블
        key: 'user_email' // 참조할 컬럼
      }
    },
    friend_email: {
      type: DataTypes.STRING(254),
      allowNull: false,
      comment: "친구 요청을 받은 사용자 이메일 (FK → Users.user_email)",
      references: {
        model: 'user',
        // 참조할 테이블
        key: 'user_email' // 참조할 컬럼
      }
    },
    friend_nickname: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: "친구 목록에서 보여질 별명 (UI 표시용)"
    },
    status: {
      type: DataTypes.ENUM("pending", "accepted", "rejected", "blocked"),
      allowNull: false,
      defaultValue: "pending",
      comment: "친구 요청 상태"
    }
  }, {
    tableName: "user_friends",
    // 실제 DB에서 사용될 테이블 이름
    timestamps: false,
    // createdAt, updatedAt 자동 생성 비활성화
    comment: "사용자 친구 관계 테이블",
    indexes: [{
      name: "user_email_friend_email_unique",
      unique: true,
      fields: ["user_email", "friend_email"] // 같은 관계 중복 방지
    }]
  });
}