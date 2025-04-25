import { DataTypes } from "sequelize";
export default function (sequelize) {
    // Species 모델 정의
    const Species = sequelize.define("species", {
        species_id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
            comment: "식물 종 ID"
        },
        species_name: {
            type: DataTypes.STRING(50),
            allowNull: false,
            comment: "종 이름",
        },
        max_temp: {
            type: DataTypes.FLOAT,
            allowNull: false,
            comment: "최대 온도",
        },
        min_temp: {
            type: DataTypes.FLOAT,
            allowNull: false,
            comment: "최소 온도",
        },
        max_light: {
            type: DataTypes.FLOAT,
            allowNull: false,
            comment: "최대 조도",
        },
        min_light: {
            type: DataTypes.FLOAT,
            allowNull: false,
            comment: "최소 조도",
        },
        max_moisture: {
            type: DataTypes.FLOAT,
            allowNull: false,
            comment: "적정 토양 수분",
        },
        min_moisture: {
            type: DataTypes.FLOAT,
            allowNull: false,
            comment: "적정 토양 수분",
        },
        opt_watering: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: "물주기",
        }
    }, {
        tableName: "species",
        timestamps: false, // createdAt, updatedAt 컬럼 사용하지 않음
        comment: "식물 종 정보",
        indexes: [
            {
                name: "species_name_unique", // 유니크 인덱스 이름
                unique: true, // 인덱스를 유니크로 설정
                fields: ["species_name"], // 인덱스를 적용할 필드
            },
        ]
    });
    return Species;
}
