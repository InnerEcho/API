import { Sequelize, DataTypes, Model } from "sequelize";
// 모델 반환 함수
export default function (sequelize) {
    return sequelize.define("growth_diary_comment", {
        comment_id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
            comment: "답글 ID (Primary Key)",
        },
        diary_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            comment: "연결된 성장일지 ID (Foreign Key)",
        },
        user_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            comment: "작성자 사용자 ID (Foreign Key)",
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
            comment: "사용자 답글 내용",
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            comment: "답글 작성일시",
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            comment: "답글 수정일시",
        },
        is_deleted: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: "삭제 여부 (소프트 삭제)",
        },
        edited: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: "수정 여부",
        },
    }, {
        tableName: "growth_diary_comment", // 테이블명
        timestamps: false, // createdAt, updatedAt 자동 관리 비활성화
        comment: "성장 일지에 대한 사용자 답글 정보",
    });
}
//# sourceMappingURL=GrowthDiaryComment.js.map