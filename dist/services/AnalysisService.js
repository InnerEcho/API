import axios from 'axios';
import db from "../models/index.js";
const EMOTION_LABELS = ['공포', '놀람', '분노', '슬픔', '중립', '행복', '혐오'];
export class AnalysisService {
  emotionEndpoint;
  factorEndpoint;
  constructor() {
    const flaskBase = process.env.FLASK_URL || 'http://localhost:5000';
    const normalizedBase = flaskBase.replace(/\/+$/, '');
    this.emotionEndpoint = `${normalizedBase}/predict`;
    this.factorEndpoint = process.env.FACTOR_API_URL ?? `${normalizedBase}/predict/factor`;
  }
  async analyzeEmotion(message) {
    try {
      const response = await axios.post(this.emotionEndpoint, {
        text: message
      });
      const data = response.data;
      if (!data || !data.predictions || !Array.isArray(data.predictions)) {
        console.warn('AnalysisService: emotion API response invalid', data);
        return undefined;
      }
      const probs = data.predictions;
      if (!Array.isArray(probs) || probs.length === 0) {
        return undefined;
      }
      const maxIndex = probs.indexOf(Math.max(...probs));
      return EMOTION_LABELS[maxIndex];
    } catch (error) {
      console.error('AnalysisService: emotion analysis failed', error);
      return undefined;
    }
  }
  async extractFactor({
    message,
    emotion,
    context
  }) {
    const trimmedMessage = message?.trim();
    if (!trimmedMessage) {
      return undefined;
    }
    if (!this.factorEndpoint) {
      // TODO: replace with external factor extraction API.
      return trimmedMessage.length > 80 ? `${trimmedMessage.slice(0, 77)}...` : trimmedMessage;
    }
    try {
      const {
        data
      } = await axios.post(this.factorEndpoint, {
        context: context ?? trimmedMessage,
        emotion,
        question: trimmedMessage
      });

      if (data && data.success === false) {
        console.warn('AnalysisService: factor API returned failure', data);
        return undefined;
      }

      const factor = typeof (data?.factor) === 'string' ? data.factor : typeof (data?.result?.factor) === 'string' ? data.result.factor : undefined;
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
    userType = 'User'
  }) {
    // Only user utterances are analysed/stored for now.
    if (userType !== 'User') {
      return {};
    }
    const existing = await db.ChatAnalysis.findOne({
      where: {
        history_id: historyId
      }
    });
    if (existing) {
      const emotion = existing.get('emotion');
      const factor = existing.get('factor');
      return {
        emotion: emotion ?? undefined,
        factor: factor ?? undefined
      };
    }
    const emotion = await this.analyzeEmotion(message);
    const factor = await this.extractFactor({
      message,
      emotion
    });
    try {
      await db.ChatAnalysis.create({
        history_id: historyId,
        emotion: emotion ?? null,
        factor: factor ?? null
      });
    } catch (error) {
      console.error('AnalysisService: failed to persist chat analysis', error);
    }
    if (emotion) {
      try {
        await db.User.update({
          state: emotion
        }, {
          where: {
            user_id: userId
          }
        });
      } catch (error) {
        console.error(`AnalysisService: failed to update user ${userId} emotion`, error);
      }
    }
    return {
      emotion,
      factor
    };
  }
  async getLatestUserAnalysis(userId) {
    const record = await db.ChatAnalysis.findOne({
      include: [{
        model: db.ChatHistory,
        as: 'history',
        attributes: ['history_id', 'message', 'plant_id', 'send_date', 'user_type', 'user_id'],
        where: {
          user_id: userId,
          user_type: 'User'
        }
      }],
      order: [['created_at', 'DESC']]
    });
    if (!record) {
      return null;
    }
    const history = record.get('history');
    const analysisId = Number(record.get('analysis_id'));
    const rawHistoryId = history?.history_id;
    const historyId = rawHistoryId === undefined || rawHistoryId === null ? null : Number(rawHistoryId);
    const safeHistoryId = Number.isNaN(historyId) ? null : historyId;
    return {
      analysisId,
      historyId: safeHistoryId,
      emotion: record.get('emotion') ?? null,
      factor: record.get('factor') ?? null,
      message: history?.message ?? null,
      plantId: history ? Number(history.plant_id) : null,
      sendDate: history?.send_date ?? null,
      createdAt: record.get('created_at')
    };
  }
}
