export interface CurrentData {
    current_temp: number;
    current_light: number;
    current_moisture: number;
}
export interface StateData {
    temp_state: '높음' | '정상' | '낮음';
    light_state: '높음' | '정상' | '낮음';
    moisture_state: '높음' | '정상' | '낮음';
}
export interface PlantData extends CurrentData, StateData {
}
