import { Sequelize, DataTypes, Model, Optional } from "sequelize";

// 식물 테이블의 모든 속성을 정의하는 인터페이스
interface PlantAttributes {
  plant_id: BigInt;          // 식물 ID
  user_id: BigInt;           // 사용자 ID (FK)
  species_id: BigInt;        // 식물 종 (FK)
  nickname: string;          // 식물 애칭 이름
  plant_level: number;     // 식물 레벨
  plant_experience: number;  // 식물 경험치
  plant_hogamdo: number;     // 식물 호감도
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
        type: DataTypes.BIGINT,
        primaryKey: true,        // PRI 키 설정
        autoIncrement: true,     // 자동 증가
        allowNull: false,
        comment: "식물 ID",
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'user',        // 참조할 테이블
          key: 'user_id',       // 참조할 컬럼
        },
        onDelete: "CASCADE",     // 유저 삭제 시 해당 식물도 삭제
        onUpdate: "CASCADE",     // 유저 ID 변경 시 업데이트
        comment: "유저 ID",
      },
      species_id: {
        type: DataTypes.BIGINT,
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
        allowNull: false,
        comment: "식물 이름",
      },
      plant_level: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: "식물 레벨",
      },
      plant_experience: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: "식물 경험치",
      },
      plant_hogamdo: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: "식물 호감도도",
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
