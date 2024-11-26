import { Sequelize, DataTypes, Model, Optional } from "sequelize";

// 식물 테이블의 모든 속성을 정의하는 인터페이스
interface PlantAttributes {
  plant_id: number;          // 식물 ID
  plant_name: string;        // 식물 이름
  plant_type?: string;       // 식물 종류 (선택사항)
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
interface PlantCreationAttributes extends Optional<PlantAttributes, 'plant_id' | 'plant_type'> {}

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
      plant_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: "식물 이름",
      },
      plant_type: {
        type: DataTypes.STRING(50),
        allowNull: true,         // null 허용
        defaultValue: null,
        comment: "식물 종류",
      },
      current_temp: {
        type: DataTypes.FLOAT,
        allowNull: false,
        comment: "현재 온도",
      },
      temp_state: {
        type: DataTypes.STRING(5),
        allowNull: false,
        defaultValue: 'UNKNOWN',
        comment: "온도 상태(범주화)",
      },
      current_light: {
        type: DataTypes.FLOAT,
        allowNull: false,
        comment: "현재 조도",
      },
      light_state: {
        type: DataTypes.STRING(5),
        allowNull: false,
        defaultValue: 'UNKNOWN',
        comment: "조도 상태(범주화)",
      },
      current_moisture: {
        type: DataTypes.FLOAT,
        allowNull: false,
        comment: "현재 토양수분",
      },
      moisture_state: {
        type: DataTypes.STRING(5),
        allowNull: false,
        defaultValue: 'UNKNOWN',
        comment: "토양수분 상태(범주화)",
      },
      watering_cycle: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: "물 주기(일단위)",
      },
      last_watered_date: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: "마지막으로 물 준 날짜",
      },
      last_measured_date: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: "최신 데이터 측정 시간",
      }
    },
    {
      tableName: "plant Information",
      timestamps: false,         // createdAt, updatedAt 컬럼 사용하지 않음
      comment: "식물 정보",
      indexes: [
        {
          name: "PRIMARY",
          unique: true,          // 중복값 허용하지 않음
          using: "BTREE",        // B-tree 인덱스 사용
          fields: [{ name: "plant_id" }],  // plant_id를 인덱스로 설정
        }
      ],
    }
  );

  return Plant;
}