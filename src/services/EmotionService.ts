import axios from 'axios';

// Flask 모델이 반환하는 감정 확률 배열 순서에 맞춰 라벨 정의
// 예: [슬픔, 행복, 분노] 순서라고 가정
const EMOTION_LABELS = ["공포", "놀람", "분노", "슬픔", "행복"];

export class EmotionService {
  private flaskUrl: string;

  constructor() {
    // Flask 서버 URL — .env로 관리하는 것이 좋음
    this.flaskUrl = process.env.FLASK_URL || 'http://localhost:5000';
  }

  /**
   * 메시지를 Flask 감정 분석 서버로 보내고, 가장 확률이 높은 감정 라벨을 반환
   * @param message 사용자 메시지
   * @returns 감정 문자열 (["공포", "놀람", "분노", "슬픔","행복"])
   */
    async analyze(message: string): Promise<{ emotion: string; cause?: string } | undefined> {
    try {
      // 1️⃣ Flask 서버로 감정 분석 요청
      const response = await axios.post(`${this.flaskUrl}/predict`, { text: message });
      const data = response.data;

      // 2️⃣ 응답 데이터 유효성 검사
      if (!data || !data.predictions || !Array.isArray(data.predictions)) {
        console.warn("EmotionService: Flask 응답 형식이 올바르지 않음", data);
        return undefined;
      }

      // 3️⃣ 가장 높은 확률 감정 선택
      const probs: number[] = data.predictions;
      const sortedProbs = [...probs].sort((a, b) => b - a);
      const maxProb = sortedProbs[0];
      const secondProb = sortedProbs[1];
      const maxIndex = probs.indexOf(maxProb);
      const dominantEmotion = EMOTION_LABELS[maxIndex];

      // 4️⃣ 불확실 감정 판정
      if (maxProb < 0.65 || Math.abs(maxProb - secondProb) < 0.15) {
        const sorted = probs
          .map((p, i) => ({ label: EMOTION_LABELS[i], prob: p }))
          .sort((a, b) => b.prob - a.prob);

        console.log("EmotionService: 불확실 감정 → undefined 반환");
        console.log(
          "🔍 감정 확률 상세:",
          sorted.map((s) => `${s.label}: ${(s.prob * 100).toFixed(1)}%`).join(", ")
        );
        console.log(`➡️ 상위 감정: ${sorted[0].label} (${(sorted[0].prob * 100).toFixed(1)}%), 2위: ${sorted[1].label} (${(sorted[1].prob * 100).toFixed(1)}%)`);

        return undefined;
      }

      // 4-2. 원인 추출기 호출
      const causeResponse = await axios.post(`${this.flaskUrl}/extract_cause`, {
        text: message,
        emotion: dominantEmotion,
      });

      const cause = causeResponse.data?.cause;
      return { emotion: dominantEmotion, cause };

    } catch (error) {
      console.error("EmotionService: 감정 분석 실패", error);
      return undefined; // 오류 시 undefined
    }
  }
}