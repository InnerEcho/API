// 센서 데이터 인터페이스
interface SensorData {
    temp: number; // 온도
    humi: number; // 습도
    soil: number; // 토양 수분
    lux: number;  // 광량
  }
  
  // 식물 정보 인터페이스
  interface PlantInfo {
    plant_name: string;             // 이름
    species: string;          // 종
    temp_start: number;       // 적정 온도 시작
    temp_end: number;         // 적정 온도 끝
    temp_lowest: number;      // 최소 온도
    humi_start: number;       // 적정 습도 시작
    humi_end: number;         // 적정 습도 끝
    lux_mid_start: number;    // 중간 광도 시작
    lux_mid_end: number;      // 중간 광도 끝
    lux_high_start: number;   // 강한 광도 시작
    lux_high_end: number;     // 강한 광도 끝
    add_info: string;         // 추가 정보
  }


export function plantState(plantInfo:PlantInfo, currentSensorData:SensorData){
    let tempStatus = "";
    let humiStatus = "";
    let soilStatus = "";
  
    // 온도 상태 분석
    if (currentSensorData.temp < plantInfo.temp_lowest) {
      tempStatus = "온도가 너무 낮아 위험해요.";
    } else if (currentSensorData.temp < plantInfo.temp_start) {
      tempStatus = "온도가 너무 낮아요.";
    } else if (currentSensorData.temp > plantInfo.temp_end) {
      tempStatus = "온도가 너무 높아요.";
    } else {
      tempStatus = "온도가 적정해요.";
    }
  
    // 습도 상태 분석
    if (currentSensorData.humi < plantInfo.humi_start) {
      humiStatus = "습도가 너무 낮아요.";
    } else if (currentSensorData.humi > plantInfo.humi_end) {
      humiStatus = "습도가 너무 높아요.";
    } else {
      humiStatus = "습도가 적정해요.";
    }
  
    // 토양 수분 상태 분석
    if (currentSensorData.soil < 40) {
      soilStatus = "토양이 건조해요. 물이 필요해요.";
    } else if (currentSensorData.soil > 70) {
      soilStatus = "토양이 너무 축축해요. 물은 그만 먹어도 될 것 같아요.";
    } else {
      soilStatus = "토양 상태가 좋아요.";
    }
  
    return `${tempStatus} ${humiStatus} ${soilStatus}`;
}