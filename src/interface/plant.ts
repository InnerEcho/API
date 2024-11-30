export interface CurrentData{
  current_temp:number,
  current_light:number,
  current_moisture:number
};

// 센서 데이터 인터페이스
export interface StateData {
  temp_state: '높음' | '정상' | '낮음'; // 온도 상태
  light_state: '높음' | '정상' | '낮음'; // 광량 상태
  moisture_state: '높음' | '정상' | '낮음'; // 토양 수분 상태
};

export interface PlantData extends CurrentData, StateData {};