import { Sequelize, DataTypes, Model, Optional } from "sequelize";

// 인터페이스 정의 - 이 모델에서 사용할 속성 정의
interface UserEventAttributes {
    user_event_id: number; // 유저 이벤트 ID (PK)
    user_id: number;  // 사용자 ID (FK)
    event_id: number; // 이벤트 ID (FK)
    plant_id: number; // 식물 ID (FK)
    status: number;   // 진행 상태 (0: 미완료, 1: 완료)
    assigned_at: Date; // 미션 할당 날짜
    completed_at: Date; // 미션 완료 날짜
    
  }

// 모델 반환 타입 정의
export default function (sequelize: Sequelize) {
  return sequelize.define<Model<UserEventAttributes>>(
    "user_event",
    {
      user_event_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,        // PRI 키 설정
        autoIncrement: true,     // 자동 증가
        allowNull: false,
        comment: "유저 이벤트트 ID",
        },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: "사용자 ID",
        references: {
          model: 'user',        // 참조할 테이블
          key: 'user_id',       // 참조할 컬럼
        },
        onDelete: "CASCADE",     // 유저 삭제 시 해당 식물도 삭제
        onUpdate: "CASCADE",     // 유저 ID 변경 시 업데이트
      },
      event_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: "사용자 ID",
        references: {
          model: 'event',        // 참조할 테이블
          key: 'event_id',       // 참조할 컬럼
        },
        onDelete: "CASCADE",     // 유저 삭제 시 해당 식물도 삭제
        onUpdate: "CASCADE",     // 유저 ID 변경 시 업데이트
      },
      plant_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: "사용자 ID",
        references: {
          model: 'plant',        // 참조할 테이블
          key: 'plant_id',       // 참조할 컬럼
        },
        onDelete: "CASCADE",     // 유저 삭제 시 해당 식물도 삭제
        onUpdate: "CASCADE",     // 유저 ID 변경 시 업데이트
      },
      status: {
        type: DataTypes.STRING(5),      // 사용자 ID를 STING로 변경
        allowNull: false,
        comment: "진행 상태",
      },
      assigned_at: {
        type: DataTypes.DATE,     
        defaultValue: DataTypes.NOW, // 등록 시 현재 시간을 기본값으로 설정
        allowNull: false,
        comment: "할당당 날짜",
      },
      completed_at: {
        type: DataTypes.DATE,     
        defaultValue: DataTypes.NOW, // 등록 시 현재 시간을 기본값으로 설정
        allowNull: false,
        comment: "완료 날짜",
      },
    },
    {
      // 테이블 설정
      tableName: "user_event",                // 실제 DB에서 사용될 테이블 이름
      timestamps: false,                // createdAt, updatedAt 자동 생성 비활성화
      comment: "유저저이벤트 정보",        // 테이블에 대한 설명
    //   indexes: [
    //     {
    //       name: "user_email_unique",    // 유니크 인덱스 이름
    //       unique: true,                 // 인덱스를 유니크로 설정
    //       fields: ["user_email"],       // 인덱스를 적용할 필드
    //     },
    //   ],
    }
  );
}
