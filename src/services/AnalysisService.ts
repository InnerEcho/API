import axios from 'axios';
import db from '@/models/index.js';

const EMOTION_LABELS = ['공포', '놀람', '분노', '슬픔', '중립', '행복', '혐오'];

type UserType = 'User' | 'Bot';

interface AnalyzeAndStoreParams {
  historyId: number;
  userId: number;
  message: string;
  userType?: UserType;
}

export class AnalysisService {
  private emotionEndpoint: string;
  private factorEndpoint?: string;

  constructor() {
    const flaskBase = process.env.FLASK_URL || 'http://localhost:5000';
    this.emotionEndpoint = `${flaskBase.replace(/\/+$/, '')}/predict`;
    this.factorEndpoint = process.env.FACTOR_API_URL;
  }

  async analyzeEmotion(message: string): Promise<string | undefined> {
  try {
    const response = await axios.post(this.emotionEndpoint, { text: message });
    const data = response.data;

    if (!data || !data.predictions || !Array.isArray(data.predictions)) {
      console.warn('AnalysisService: emotion API response invalid', data);
      return undefined;
    }

    const probs: number[] = data.predictions;
    if (!Array.isArray(probs) || probs.length === 0) {
      return undefined;
    }

    const sortedProbs = [...probs].sort((a, b) => b - a);
    const maxProb = sortedProbs[0];
    const secondProb = sortedProbs[1];
    const maxIndex = probs.indexOf(maxProb);
    const dominantEmotion = EMOTION_LABELS[maxIndex];

    // 4️⃣ 불확실 감정 판정
    if (maxProb < 0.55 || Math.abs(maxProb - secondProb) < 0.08) {
      const sorted = probs
        .map((p, i) => ({ label: EMOTION_LABELS[i], prob: p }))
        .sort((a, b) => b.prob - a.prob);

      console.log("AnalysisService: 불확실 감정 → undefined 반환");
      console.log(
        "🔍 감정 확률 상세:",
        sorted.map((s) => `${s.label}: ${(s.prob * 100).toFixed(1)}%`).join(", ")
      );
      console.log(
        `➡️ 상위 감정: ${sorted[0].label} (${(sorted[0].prob * 100).toFixed(1)}%), 2위: ${sorted[1].label} (${(sorted[1].prob * 100).toFixed(1)}%)`
      );

      return undefined;
    }

    // 5️⃣ 최종 감정 반환
    return dominantEmotion;

  } catch (error) {
    console.error('AnalysisService: emotion analysis failed', error);
    return undefined;
  }
  }

  async extractFactor(message: string): Promise<string | undefined> {
    if (!message) {
      return undefined;
    }

    if (!this.factorEndpoint) {
      // TODO: replace with external factor extraction API.
      const trimmed = message.trim();
      return trimmed.length > 80 ? `${trimmed.slice(0, 77)}...` : trimmed;
    }

    try {
      const response = await axios.post(this.factorEndpoint, { text: message });
      const { factor } = response.data ?? {};
      if (typeof factor === 'string' && factor.length > 0) {
        return factor;
      }
      return undefined;
    } catch (error) {
      console.error('AnalysisService: factor extraction failed', error);
      return undefined;
    }
  }

  async analyzeAndStore({
    historyId,
    userId,
    message,
    userType = 'User',
  }: AnalyzeAndStoreParams): Promise<{ emotion?: string; factor?: string }> {
    // Only user utterances are analysed/stored for now.
    if (userType !== 'User') {
      return {};
    }

    const existing = await db.ChatAnalysis.findOne({
      where: { history_id: historyId },
    });

    if (existing) {
      const emotion = existing.get('emotion') as string | null;
      const factor = existing.get('factor') as string | null;
      return {
        emotion: emotion ?? undefined,
        factor: factor ?? undefined,
      };
    }

    const [emotion, factor] = await Promise.all([
      this.analyzeEmotion(message),
      this.extractFactor(message),
    ]);

    try {
      await db.ChatAnalysis.create({
        history_id: historyId,
        emotion: emotion ?? null,
        factor: factor ?? null,
      });
    } catch (error) {
      console.error('AnalysisService: failed to persist chat analysis', error);
    }

    if (emotion) {
      try {
        await db.User.update({ state: emotion }, { where: { user_id: userId } });
      } catch (error) {
        console.error(
          `AnalysisService: failed to update user ${userId} emotion`,
          error,
        );
      }
    }

    return { emotion, factor };
  }

  async getLatestUserAnalysis(userId: number): Promise<{
    analysisId: number;
    historyId: number;
    emotion: string | null;
    factor: string | null;
    message: string | null;
    plantId: number | null;
    sendDate: Date | null;
    createdAt: Date;
  } | null> {
    const record = await db.ChatAnalysis.findOne({
      include: [
        {
          model: db.ChatHistory,
          as: 'history',
          attributes: ['history_id', 'message', 'plant_id', 'send_date', 'user_type', 'user_id'],
          where: {
            user_id: userId,
            user_type: 'User',
          },
        },
      ],
      order: [['created_at', 'DESC']],
    });

    if (!record) {
      return null;
    }

    const history = record.get('history') as any;
    const analysisId = Number(record.get('analysis_id'));
    const rawHistoryId = history?.history_id;
    const historyId =
      rawHistoryId === undefined || rawHistoryId === null
        ? null
        : Number(rawHistoryId);
    const safeHistoryId = Number.isNaN(historyId) ? null : historyId;

    return {
      analysisId,
      historyId: safeHistoryId,
      emotion: (record.get('emotion') as string | null) ?? null,
      factor: (record.get('factor') as string | null) ?? null,
      message: history?.message ?? null,
      plantId: history ? Number(history.plant_id) : null,
      sendDate: history?.send_date ?? null,
      createdAt: record.get('created_at') as Date,
    };
  }
}
