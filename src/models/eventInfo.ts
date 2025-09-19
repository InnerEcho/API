import { Sequelize, DataTypes, Model } from "sequelize";

// event 모델 속성 인터페이스 정의
interface eventAttributes {
  event_id: BigInt;           // 미션 ID (PK)
  event_title: string;        // 미션 제목
  event_content: string;      // 미션 내용
  exp_reward: number;          // 미션 완료 시 지급되는 경험치
  created_at: Date;             // 생성 날짜
}

// event 모델 반환 타입 정의
export default function (sequelize: Sequelize) {
  return sequelize.define<Model<eventAttributes>>(
    "event",
    {
      event_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        comment: "미션 ID (Primary Key)",
      },
      event_title: {
        type: DataTypes.STRING(256),
        allowNull: false,
        comment: "미션 제목",
      },
      event_content: {
        type: DataTypes.TEXT, // 내용은 길어질 수 있으므로 TEXT 타입으로 변경하는 것을 추천합니다.
        allowNull: false,
        comment: "미션 내용",
      },
      // 요청하신 경험치 필드를 추가했습니다.
      exp_reward: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0, // 기본값을 0으로 설정하여 안정성을 높입니다.
        comment: "미션 완료 시 지급되는 경험치",
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
        comment: "생성 날짜",
      },
    },
    {
      // 테이블 설정
      tableName: "event",             // 실제 DB에서 사용될 테이블 이름
      timestamps: false,                // createdAt, updatedAt 자동 생성을 비활성화합니다.
      comment: "미션 정보",         // 테이블에 대한 설명
    }
  );
}