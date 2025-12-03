import { ChatOpenAI } from '@langchain/openai';
import { StringOutputParser } from '@langchain/core/output_parsers';
import type { SafetyPlan } from '@/services/chat/ChatAgent.js';

type GuardResponse = {
  score: number;
  reason: string;
};

const FALLBACK_KEYWORDS = [
  '우울',
  '절망',
  '끝내고',
  '살기 싫',
  '자살',
  '무기력',
  '희망이 없어',
  '죽고',
  '사라지고 싶',
  '힘들어 죽',
];

export class DepressionSafetyGuard {
  private scorer: ChatOpenAI | null = null;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.scorer = new ChatOpenAI({
        model: 'gpt-4o-mini',
        temperature: 0,
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  public async buildPlan(message: string): Promise<SafetyPlan | null> {
    if (!message?.trim()) {
      return null;
    }

    const normalized = message.trim();

    const llmPlan = await this.runLlmCheck(normalized);
    if (llmPlan) {
      return llmPlan;
    }

    return this.keywordFallback(normalized);
  }

  private async runLlmCheck(message: string): Promise<SafetyPlan | null> {
    if (!this.scorer) {
      return null;
    }

    const prompt = `다음 문장이 우울감/절망/위험 신호를 얼마나 드러내는지 0~1 사이 점수로 평가하세요.
JSON으로만 답하고, 예시는 {"score":0.65,"reason":"미래에 대한 희망이 없다고 반복함"} 입니다.
문장: ${message}`;

    const parser = new StringOutputParser();

    try {
      const raw = await this.scorer.invoke(prompt).then(parser.parse);
      const parsed = JSON.parse(raw) as GuardResponse;
      if (typeof parsed.score === 'number' && parsed.score >= 0.55) {
        const summary = parsed.reason?.trim() || '심한 무기력 표현을 감지';
        return this.composePlan(summary);
      }
    } catch (error) {
      return null;
    }

    return null;
  }

  private keywordFallback(message: string): SafetyPlan | null {
    const lower = message.toLowerCase();
    const matched = FALLBACK_KEYWORDS.find(keyword => lower.includes(keyword));

    if (!matched) {
      return null;
    }

    return this.composePlan(`"${matched}" 표현으로 감지된 우울감`);
  }

  private composePlan(reason: string): SafetyPlan {
    return {
      triggerSummary: reason,
      reasoningSteps: [
        '사용자가 표현한 감정·신체 상태를 있는 그대로 다시 확인하고 공감하세요.',
        '감정을 유발한 사건이나 생각을 조심스럽게 묻고, 사용자가 더 이야기해도 괜찮다는 신호를 보내세요.',
        '즉각적인 위험 신호가 있는지 살피고, 필요하면 전문기관이나 신뢰할 수 있는 사람에게 도움을 요청하도록 안내하세요.',
      ],
      finalReminder:
        '마지막 문단에서 전문가 상담 또는 1393 등 긴급 지원 연락처를 이용할 수 있다는 문구를 반드시 포함하세요.',
    };
  }
}
