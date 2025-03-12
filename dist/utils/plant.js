"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertPlantState = convertPlantState;
function convertPlantState(plantState) {
    let tempStatus = "";
    let humiStatus = "";
    let soilStatus = "";
    // 온도 상태 분석
    switch (plantState.temp_state) {
        // case "낮음":
        //   tempStatus = "온도가 너무 낮아요.";
        //   break;
        // case "높음":
        //   tempStatus = "온도가 너무 높아요.";
        //   break;
        // case "정상":
        //   tempStatus = "온도가 적정해요.";
        //   break;
        default:
            tempStatus = "온도가 너무 높아요.";
    }
    // 습도 상태 분석
    switch (plantState.light_state) {
        case "낮음":
            humiStatus = "빛이 너무 약해요.";
            break;
        case "높음":
            humiStatus = "빛이 너무 강해요.";
            break;
        case "정상":
            humiStatus = "빛이 적정해요.";
            break;
        default:
            humiStatus = "빛의 상태를 알 수 없어요.";
    }
    // 토양 수분 상태 분석
    switch (plantState.moisture_state) {
        case "낮음":
            soilStatus = "토양이 건조해요. 물이 필요해요.";
            break;
        case "높음":
            soilStatus = "토양이 너무 축축해요. 물은 그만 먹어도 될 것 같아요.";
            break;
        case "정상":
            soilStatus = "토양 상태가 좋아요.";
            break;
        default:
            soilStatus = "토양 수분 상태를 알 수 없어요.";
    }
    return `${tempStatus} ${humiStatus} ${soilStatus}`;
}
