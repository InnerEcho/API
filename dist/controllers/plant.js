"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlantState = void 0;
const index_1 = __importDefault(require("../models/index"));
const getPlantState = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let apiResult = {
        code: 400,
        data: null,
        msg: 'Failed',
    };
    try {
        const userId = req.body.user_id; //사용자 이름 추출
        const plantId = req.body.plant_id; //식물 이름 추출
        const plantDb = yield index_1.default.sequelize.query(`
        SELECT p.nickname, p.current_temp, p.current_light, p.current_moisture, p.temp_state, p.light_state, p.moisture_state
        FROM user u, plant p
        WHERE u.user_id = ${userId} AND p.plant_id = ${plantId};
      `, {
            type: index_1.default.Sequelize.QueryTypes.SELECT,
        });
        // 더미 데이터 정의
        const plantData = {
            plant_id: plantId,
            user_id: userId,
            plant_name: `${plantDb[0].nickname}`,
            current_temp: {
                value: plantDb[0].current_temp,
                state: `${plantDb[0].temp_state}`,
            },
            current_light: {
                value: plantDb[0].current_light,
                state: `${plantDb[0].light_state}`,
            },
            current_moisture: {
                value: plantDb[0].current_moisture / 10,
                state: `${plantDb[0].moisture_state}`,
            },
            watering_cycle: 7,
            last_watered_date: '2024-12-01T10:00:00Z',
            last_measured_date: '2024-12-08T15:30:00Z',
        };
        console.log(plantData);
        if (plantDb.length > 0) {
            apiResult.code = 200;
            apiResult.data = plantData;
            apiResult.msg = 'Ok';
        }
        else {
            apiResult.code = 404;
            apiResult.msg = 'Not Exits PlantData';
        }
    }
    catch (err) {
        apiResult.code = 500;
        apiResult.data = null;
        apiResult.msg = 'ServerError';
        console.log(err);
    }
    res.json(apiResult);
});
exports.getPlantState = getPlantState;
