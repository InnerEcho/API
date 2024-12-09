import { Sequelize, DataTypes, Model, Optional } from "sequelize";

// 식물 테이블의 모든 속성을 정의하는 인터페이스
interface PlantAttributes {
  plant_id: number;          // 식물 ID
  user_id: number;           // 사용자 ID (FK)
  species_id: number;        // 식물 종 (FK)
  nickname: string;          // 식물 애칭 이름
  current_temp: number;      // 현재 온도
  temp_state: string;        // 온도 상태
  current_light: number;     // 현재 조도
  light_state: string;       // 조도 상태
  current_moisture: number;  // 현재 토양수분
  moisture_state: string;    // 토양수분 상태
  watering_cycle: number;    // 물주기 주기(일)
  last_watered_date: Date;   // 마지막 물준 날짜
  last_measured_date: Date;  // 마지막 측정 날짜
}

// `plant_id`는 자동 생성되므로 Optional로 처리
interface PlantCreationAttributes extends Optional<PlantAttributes, 'plant_id'> {}

export default function (sequelize: Sequelize) {
  // Plant 모델 정의
  const Plant = sequelize.define<Model<PlantAttributes, PlantCreationAttributes>>(
    "plant",
    {
      plant_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,        // PRI 키 설정
        autoIncrement: true,     // 자동 증가
        allowNull: false,
        comment: "식물 ID",
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
      species_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'species',     // 참조할 테이블
          key: 'species_id',    // 참조할 컬럼
        },
        onDelete: "CASCADE",     // 종 삭제 시 해당 데이터도 삭제
        onUpdate: "CASCADE",     // 종 정보 변경 시 업데이트
        comment: "식물 종 ID",
      },
      nickname: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: null,
        comment: "식물 이름",
      },
      current_temp: {
        type: DataTypes.FLOAT,
        allowNull: false,
        comment: "현재 온도",
      },
      temp_state: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: 'UNKNOWN',
        comment: "온도 상태(value: 낮음 | 정상 | 높음)",
      },
      current_light: {
        type: DataTypes.FLOAT,
        allowNull: false,
        comment: "현재 조도",
      },
      light_state: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: 'UNKNOWN',
        comment: "조도 상태(value: 낮음 | 정상 | 높음)",
      },
      current_moisture: {
        type: DataTypes.FLOAT,
        allowNull: false,
        comment: "현재 토양수분",
      },
      moisture_state: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: 'UNKNOWN',
        comment: "토양수분 상태(value: 낮음 | 정상 | 높음)",
      },
      watering_cycle: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: "물 주기(일 단위)",
      },
      last_watered_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: "마지막으로 물 준 날짜",
      },
      last_measured_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: "최신 데이터 측정 시간",
      },
    },
    {
      tableName: "plant", // 테이블 이름
      timestamps: false, // createdAt, updatedAt 자동 생성 비활성화
      comment: "유저가 키우는 식물 정보", // 테이블 설명
    }
  );

  return Plant;
}
