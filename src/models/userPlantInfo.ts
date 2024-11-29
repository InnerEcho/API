import { Sequelize, DataTypes, Model, Optional } from "sequelize";

// 식물 테이블의 모든 속성을 정의하는 인터페이스
interface PlantAttributes {
  plant_id: number;          // 식물 ID
  user_id: string;           // 사용자 ID
  species_id: number;        // 식물 종
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

// plant_id는 자동 생성되고, plant_type은 선택적 입력이므로 Optional로 처리
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
        type: DataTypes.STRING(20),
        allowNull: false,
        comment: "사용자 ID",
        references: {
          model: 'user',
          key: 'user_id'
        }
      },
      species_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'species',
          key: 'species_id'
        },
        comment: "식물 종 ID"
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
        comment: "온도 상태(value: 낮음 | 적정 | 높음)",
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
        comment: "조도 상태((value: 낮음 | 적정 | 높음))",
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
        comment: "토양수분 상태((value: 낮음 | 적정 | 높음))",
      },
      watering_cycle: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: "물 주기(일단위)",
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
      }
    },
    {
      tableName: "plant",
      timestamps: false,         // createdAt, updatedAt 컬럼 사용하지 않음
      comment: "유저가 키우는 식물 정보",
    }
  );

  return Plant;
}