import axios from 'axios';

// Flask 모델이 반환하는 감정 확률 배열 순서에 맞춰 라벨 정의
// 예: [슬픔, 행복, 분노] 순서라고 가정
const EMOTION_LABELS = ["공포", "놀람", "분노", "슬픔", "중립", "행복", "혐오"];

export class EmotionService {
  private flaskUrl: string;

  constructor() {
    // Flask 서버 URL — .env로 관리하는 것이 좋음
    this.flaskUrl = process.env.FLASK_URL || 'http://localhost:5000';
  }

  /**
   * 메시지를 Flask 감정 분석 서버로 보내고, 가장 확률이 높은 감정 라벨을 반환
   * @param message 사용자 메시지
   * @returns 감정 문자열 (["공포", "놀람", "분노", "슬픔", "중립", "행복", "혐오"])
   */
  async analyze(message: string): Promise<string | undefined> {
    try {
      // 1️⃣ Flask 서버로 감정 분석 요청
      const response = await axios.post(`${this.flaskUrl}/predict`, { text: message });
      const data = response.data;

      // 2️⃣ 응답 데이터 유효성 검사
      if (!data || !data.predictions || !Array.isArray(data.predictions[0])) {
        console.warn('EmotionService: Flask 응답 형식이 올바르지 않음', data);
        return undefined;  // 오류 시 undefined 반환;
      }

      // 3️⃣ 가장 높은 확률 감정 선택
      const probs: number[] = data.predictions[0];
      const maxIndex = probs.indexOf(Math.max(...probs));
      const dominantEmotion = EMOTION_LABELS[maxIndex];

      return dominantEmotion;

    } catch (error) {
      console.error('EmotionService: 감정 분석 요청 실패', error);
      return undefined;  // 오류 시 undefined 반환
    }
  }
}