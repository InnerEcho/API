import { DataTypes } from "sequelize";
// 모델 반환 타입 정의
export default function (sequelize) {
    return sequelize.define("user", {
        user_id: {
            type: DataTypes.BIGINT, // 사용자 ID를 INT로 변경
            primaryKey: true, // 기본 키 설정
            autoIncrement: true, // 자동 증가
            allowNull: false,
            comment: "사용자 ID (Primary Key)",
        },
        user_email: {
            type: DataTypes.STRING(254), // 이메일 필드
            allowNull: false,
            validate: {
                isEmail: true, // 유효한 이메일 형식인지 확인
            },
            comment: "사용자 이메일 (아이디 역할)",
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
        user_gender: {
            type: DataTypes.STRING(5),
            allowNull: false,
            comment: "사용자 성별",
        },
        state: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: "사용자 상태 값"
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
    }, {
        // 테이블 설정
        tableName: "user", // 실제 DB에서 사용될 테이블 이름
        timestamps: false, // createdAt, updatedAt 자동 생성 비활성화
        comment: "사용자 계정정보", // 테이블에 대한 설명
        indexes: [
            {
                name: "user_email_unique", // 유니크 인덱스 이름
                unique: true, // 인덱스를 유니크로 설정
                fields: ["user_email"], // 인덱스를 적용할 필드
            },
        ],
    });
}
