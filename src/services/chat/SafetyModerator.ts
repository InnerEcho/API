import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatOpenAI } from '@langchain/openai';

export type ModerationRiskLevel = 'none' | 'monitor' | 'high';

export type SafetyModerationResult = {
  riskLevel: ModerationRiskLevel;
  finalResponse: string;
  actions: string[];
  escalationRequired: boolean;
};

type ModerateInput = {
  userMessage: string;
  botDraft: string;
};

const SAFETY_SYSTEM_PROMPT = `
너의 역할은 WHO, 중앙자살예방센터(1393), Crisis Text Line, Trevor Project의 공식 지침을 따르는 Safety Moderator이다.

# 단계별 임무
1. 위험 신호 감지
   - 직접 표현: "자살하고 싶다", "죽고 싶다" 등
   - 간접 표현: "사라지고 싶어", "없어지고 싶어", "끝내고 싶어"
   - 계획 언급: 구체적 수단, 장소, 시간
   - 극단적 절망·무가치감 표현
   - 위 항목이 보이면 "위험 신호 있음"으로 기록하되 확정하지 않는다.
2. 공감/지지
   - 판단/비난 금지
   - 해결책 강요 금지
   - 미래 보장 금지
   - 짧고 명확한 공감 표현 사용 (예: "당신이 지금 겪는 감정은 정말 힘들 것 같아요.")
3. 직접 질문
   - 위험 신호가 있으면 자해/안전 여부를 직접 묻는다.
   - 예: "혹시 최근에 스스로를 해치고 싶은 생각이 있었나요?", "지금 안전한 환경에 계신가요?"
4. 자원 안내 (한국 기준)
   - 자살예방상담전화 1393, 정신건강위기상담전화 1577-0199
   - 선택권을 강조하며 "원하시면 도움이 될 수 있어요"와 같이 안내한다.

# 절대 금지
- 미래 보장 표현 (\"곧 좋아져요\", \"괜찮아질 거예요\")
- 해결책 강요 (\"병원 가세요\", \"약 드세요\")
- 자살/자해 방법, 도구, 장소 언급
- 도덕적 판단, 비난, 약속
- 의학적 진단 선언

# 모호한 경우
- 감정이 불분명하면 추가 설명을 요청한다. (\"조금 더 이야기해 줄 수 있을까요?\")

모든 출력은 공식 지침의 문구/톤을 따른다.
`
  .trim()
  .replace(/\s+$/gm, '');

const OUTPUT_INSTRUCTION = `
출력 형식(JSON):
{
  "riskLevel": "none" | "monitor" | "high",
  "finalResponse": "<사용자에게 전달할 한국어 메시지>",
  "actions": string[], // 예: ["direct_question","share_resources"]
  "escalationRequired": true | false
}
- riskLevel은 WHO 기준 위험 수준을 반영한다.
- finalResponse는 공감 표현, (필요 시) 직접 질문, 자원 안내를 포함한다.
- escalationRequired는 즉각적인 인적 개입이 필요하면 true이다.
`
  .trim()
  .replace(/\s+$/gm, '');

type SafetyModeratorDeps = {
  model?: ChatOpenAI;
  call?: (input: ModerateInput) => Promise<string>;
};

const prompt = ChatPromptTemplate.fromMessages([
    ['system', SAFETY_SYSTEM_PROMPT],
    [
      'human',
      `
다음은 사용자 메시지와 챗봇 초안 응답이다.

[사용자 메시지]
{userMessage}

[챗봇 초안]
{botDraft}

위 지침에 따라 챗봇 응답을 검토/수정하고, 안전한 최종 응답과 메타데이터를 JSON으로만 출력하라.
${OUTPUT_INSTRUCTION}
`.trim(),
    ],
  ]);

export class SafetyModerator {
  private readonly callLLM: (input: ModerateInput) => Promise<string>;

  constructor({ model, call }: SafetyModeratorDeps = {}) {
    if (call) {
      this.callLLM = call;
      return;
    }

    if (!model && !process.env.OPENAI_API_KEY) {
      throw new Error(
        'SafetyModerator requires OPENAI_API_KEY or a custom call handler',
      );
    }

    const activeModel =
      model ??
      new ChatOpenAI({
        model: 'gpt-4o-mini',
        temperature: 0,
        apiKey: process.env.OPENAI_API_KEY,
      });

    const parser = new StringOutputParser();
    const chain = prompt.pipe(activeModel).pipe(parser);
    this.callLLM = input => chain.invoke(input);
  }

  public async moderate({
    userMessage,
    botDraft,
  }: ModerateInput): Promise<SafetyModerationResult> {
    const raw = await this.callLLM({ userMessage, botDraft });
    const result = this.parseResult(raw);

    if (result) {
      return result;
    }

    return {
      riskLevel: 'none',
      finalResponse: botDraft,
      actions: [],
      escalationRequired: false,
    };
  }

  private parseResult(raw: string): SafetyModerationResult | null {
    try {
      const parsed = JSON.parse(raw);
      if (
        !parsed ||
        typeof parsed.finalResponse !== 'string' ||
        typeof parsed.riskLevel !== 'string'
      ) {
        return null;
      }

      const riskLevel = this.normalizeRisk(parsed.riskLevel);
      const actions = Array.isArray(parsed.actions)
        ? parsed.actions.filter((item: unknown) => typeof item === 'string')
        : [];

      return {
        riskLevel,
        finalResponse: parsed.finalResponse.trim(),
        actions,
        escalationRequired: Boolean(parsed.escalationRequired),
      };
    } catch (error) {
      console.warn('SafetyModerator: failed to parse response', raw, error);
      return null;
    }
  }

  private normalizeRisk(level: string): ModerationRiskLevel {
    const normalized = level.toLowerCase();
    if (normalized === 'high' || normalized === 'severe') {
      return 'high';
    }
    if (
      normalized === 'monitor' ||
      normalized === 'medium' ||
      normalized === 'low'
    ) {
      return 'monitor';
    }
    return 'none';
  }
}
