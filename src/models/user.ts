import { Sequelize, DataTypes, Model, Optional } from "sequelize";


// 인터페이스 정의 - 이 모델에서 사용할 속성 정의
interface UserAttributes {
  user_id: number;
  name: string;
  email: string;
  password: string;
  summary?: string;
  reg_date: Date;
  edit_date?: Date;
}

// 선택적 필드만 포함하는 인터페이스 (즉, 기본적으로 `user_id`는 자동 생성되므로 입력할 필요가 없음)
interface UserCreationAttributes extends Optional<UserAttributes, 'user_id' | 'summary' | 'edit_date'> {}

// 모델 반환 타입 정의
export default function (sequelize: Sequelize) {
  return sequelize.define<Model<UserAttributes, UserCreationAttributes>>(
    "user",
    {
      user_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
        comment: "사용자 고유번호",
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        comment: "사용자 닉네임",
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // 이메일은 고유해야 하므로 unique 인덱스를 추가했습니다.
        validate: {
          isEmail: true, // 유효한 이메일 형식인지 확인합니다.
        },
        comment: "사용자 이메일",
      },
      password: {
        type: DataTypes.STRING(200),
        allowNull: false,
        comment: "사용자 난독화된 단방향 암호화된 텍스트값",
      },
      summary: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "간략한 자기소개",
      },
      reg_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW, // 등록 시 현재 시간을 기본값으로 설정합니다.
        comment: "등록일시",
      },
      edit_date: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "수정일시",
      },
    },
    {
      tableName: "user",
      timestamps: false,
      comment: "사용자 계정정보",
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "user_id" }],
        },
        {
          name: "email_unique",
          unique: true,
          fields: [{ name: "email" }], // 이메일에 대한 고유 인덱스 추가
        },
      ],
    }
  );
}
