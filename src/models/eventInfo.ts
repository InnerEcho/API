import { Sequelize, DataTypes, Model, Optional } from "sequelize";

// 인터페이스 정의 - 이 모델에서 사용할 속성 정의
interface EventAttributes {
  event_id: number; // 이벤트 ID(PK)
  title: string; // 이벤트 제목
  description: string; // 이벤트 설명
  update_at: Date; // 생성 날짜
}


// 모델 반환 타입 정의
export default function (sequelize: Sequelize) {
  return sequelize.define<Model<EventAttributes>>(
    "event",
    {
      event_id: {
        type: DataTypes.INTEGER,      // 사용자 ID를 INT로 변경
        primaryKey: true,             // 기본 키 설정
        autoIncrement: true,          // 자동 증가
        allowNull: false,
        comment: "이벤트 ID (Primary Key)",
      },
      title: {
        type: DataTypes.STRING(256),      // 사용자 ID를 STRING로 변경
        allowNull: false,
        comment: "이벤트 제목",
      },
      description: {
        type: DataTypes.STRING(256),      // 사용자 ID를 STING로 변경
        allowNull: false,
        comment: "설명",
      },
      update_at: {
        type: DataTypes.DATE,      // 사용자 ID를 INT로 변경
        defaultValue: DataTypes.NOW, // 등록 시 현재 시간을 기본값으로 설정
        allowNull: false,
        comment: "생성 날짜",
      },
    },
    {
      // 테이블 설정
      tableName: "event",                // 실제 DB에서 사용될 테이블 이름
      timestamps: false,                // createdAt, updatedAt 자동 생성 비활성화
      comment: "이벤트 정보",        // 테이블에 대한 설명
    //   indexes: [
    //     {
    //       name: "user_email_unique",    // 유니크 인덱스 이름
    //       unique: true,                 // 인덱스를 유니크로 설정
    //       fields: ["user_email"],       // 인덱스를 적용할 필드
    //     },
    //   ],
    }
  );
  return ;
}
