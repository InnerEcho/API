"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const sequelize_1 = require("sequelize");
// 모델 반환 타입 정의
function default_1(sequelize) {
    return sequelize.define("event", {
        event_id: {
            type: sequelize_1.DataTypes.BIGINT, // 사용자 ID를 INT로 변경
            primaryKey: true, // 기본 키 설정
            autoIncrement: true, // 자동 증가
            allowNull: false,
            comment: "이벤트 ID (Primary Key)",
        },
        event_title: {
            type: sequelize_1.DataTypes.STRING(256), // 이벤트 제목을 STRING로 변경
            allowNull: false,
            comment: "이벤트 제목",
        },
        event_content: {
            type: sequelize_1.DataTypes.STRING(256), // 이벤트 내용용를 STRING로 변경
            allowNull: false,
            comment: "이벤트 내용",
        },
        update_at: {
            type: sequelize_1.DataTypes.DATE, // 사용자 ID를 INT로 변경
            defaultValue: sequelize_1.DataTypes.NOW, // 등록 시 현재 시간을 기본값으로 설정
            allowNull: false,
            comment: "생성 날짜",
        },
    }, {
        // 테이블 설정
        tableName: "event", // 실제 DB에서 사용될 테이블 이름
        timestamps: false, // createdAt, updatedAt 자동 생성 비활성화
        comment: "이벤트 정보", // 테이블에 대한 설명
        //   indexes: [
        //     {
        //       name: "user_email_unique",    // 유니크 인덱스 이름
        //       unique: true,                 // 인덱스를 유니크로 설정
        //       fields: ["user_email"],       // 인덱스를 적용할 필드
        //     },
        //   ],
    });
    return;
}
