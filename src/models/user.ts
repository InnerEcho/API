import { Sequelize, DataTypes, Model, Optional } from "sequelize";


// 인터페이스 정의 - 이 모델에서 사용할 속성 정의
interface UserAttributes {
  user_id: number;
  password: string;
  user_name: string;
  user_email: string;
  phone_number: string;
  birth_date: Date;
  created_at: Date;
}

// 선택적 필드만 포함하는 인터페이스 (즉, 기본적으로 `user_id`는 자동 생성되므로 입력할 필요가 없음)
interface UserCreationAttributes extends Optional<UserAttributes, 'user_id' | 'phone_number' | 'birth_date'> {}

// 모델 반환 타입 정의
export default function (sequelize: Sequelize) {
  return sequelize.define<Model<UserAttributes, UserCreationAttributes>>(
    "user",
    {
      user_id: {
        type: DataTypes.STRING(20),
        primaryKey: true,
        allowNull: false,
        comment: "사용자 ID",
      },
      password: {
        type: DataTypes.STRING(256),
        allowNull: false,
        comment: "비밀번호",
      },
      user_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: "사용자 이름",
      },
      user_email: {
        type: DataTypes.STRING(254),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true, // 유효한 이메일 형식인지 확인
        },
        comment: "이메일",
      },
      phone_number: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: "전화번호",
      },
      birth_date: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "생년월일",
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW, // 등록 시 현재 시간을 기본값으로 설정
        comment: "가입 날짜",
      },
    },
    {
      // 테이블 설정
      tableName: "user",                // 실제 DB에서 사용될 테이블 이름
      timestamps: false,                // createdAt, updatedAt 자동 생성 비활성화
      comment: "사용자 계정정보",        // 테이블에 대한 설명
    
      // 인덱스 설정
      indexes: [
        {
          name: "PRIMARY",             // 기본키 인덱스 이름
          unique: true,                // 고유값 설정 (중복 불가)
          using: "BTREE",              // B-tree 인덱스 알고리즘 사용
          fields: [{ name: "user_id" }] // user_id 필드를 기본키로 설정
        },
        {
          name: "email_unique",        // 이메일 인덱스 이름
          unique: true,                // 이메일도 고유값으로 설정
          fields: [{ name: "email" }]  // email 필드에 인덱스 적용
        }
      ]
    }
  );
}
