import db from '@/models/index.js';
import { RunnableWithMessageHistory, RunnablePassthrough } from '@langchain/core/runnables';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { BaseMessage, HumanMessage } from '@langchain/core/messages';
import type { PlantDbInfo } from '@/interface/index.js';
import { AnalysisService } from '@/services/analysis/AnalysisService.js';
import type {
  ChatAgentOptions,
  SafetyPlan,
} from '@/services/chat/ChatAgent.js';
import type { ChatModelFactory } from '@/services/llm/ChatModelFactory.js';
import type { MemorySnippet } from '@/services/memory/LongTermMemory.js';
import { RedisChatMessageHistory } from './RedisChatMessageHistory.js';

export type LatestAnalysis = Awaited<
  ReturnType<AnalysisService['getLatestUserAnalysis']>
>;

export abstract class BaseChatBot {
  private readonly analysisService: AnalysisService;

  constructor(
    private readonly llmFactory: ChatModelFactory,
    analysisService: AnalysisService = new AnalysisService(),
  ) {
    this.analysisService = analysisService;
  }

  public async processChat(
    userId: number,
    plantId: number,
    userMessage: string,
    options: ChatAgentOptions = {},
  ): Promise<string> {
    const { storeHistory = true, safetyPlan } = options;
    // Sequelize 모델을 사용하여 user, plant, species 정보를 JOIN
    const plant = await db.Plant.findOne({
      where: {
        user_id: userId,
        plant_id: plantId,
      },
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['user_name'],
        },
        {
          model: db.Species,
          as: 'species',
          attributes: ['species_name'],
        },
      ],
    });

    if (!plant) {
      throw new Error('식물 정보를 찾을 수 없습니다.');
    }

    // PlantDbInfo 형식으로 변환
    const plantDbInfo = {
      userName: plant.get('user')?.user_name,
      nickname: plant.get('nickname'),
      speciesName: plant.get('species')?.species_name,
    };

    const latestAnalysis = await this.analysisService.getLatestUserAnalysis(
      userId,
    );
    const analysisContextVariable = 'analysisContext';
    const analysisContextPlaceholder = `{${analysisContextVariable}}`;
    const prompt = await this.createPrompt(
      plantDbInfo,
      userId,
      plantId,
      userMessage,
      latestAnalysis,
      analysisContextPlaceholder,
    );
    const guardedPrompt = this.applySafetyPlan(prompt, safetyPlan);
    const enhancedPrompt = this.applyLongTermMemories(
      guardedPrompt,
      options.longTermMemories,
    );

    const llm = this.llmFactory.create();

    const userMessageTemplate = ChatPromptTemplate.fromMessages(
      enhancedPrompt,
    );
    const outputParser = new StringOutputParser();
    const llmChain = RunnablePassthrough.assign<{
      input: string;
      history?: BaseMessage[];
      analysisContext?: string;
    }, {
      analysisContext: string;
    }>({
      analysisContext: ({ history }) =>
        this.buildAnalysisContext({
          plantDbInfo,
          history,
          latestAnalysis,
        }),
    })
      .pipe(userMessageTemplate)
      .pipe(llm)
      .pipe(outputParser);

    // 2. RunnableWithMessageHistory 설정 변경
    const historyStore = new RedisChatMessageHistory(userId, plantId);

    if (storeHistory) {
      const historyChain = new RunnableWithMessageHistory({
        runnable: llmChain,
        getMessageHistory: () => historyStore,
        inputMessagesKey: 'input',
        historyMessagesKey: 'history',
      });

      return historyChain.invoke(
        { input: userMessage, analysisContext: '' },
        {
          configurable: {
            sessionId: `${userId}-${plantId}`,
          },
        },
      );
    }

    const historyMessages = await historyStore.getMessages();
    return llmChain.invoke({
      input: userMessage,
      history: historyMessages,
      analysisContext: '',
    });
  }

  protected abstract createPrompt(
    plantDbInfo: PlantDbInfo,
    userId: number,
    plantId: number,
    userMessage: string,
    latestAnalysis: LatestAnalysis,
    analysisContextPlaceholder: string,
  ): Promise<Array<[string, string]>>;

  private applySafetyPlan(
    prompt: Array<[string, string]>,
    plan?: SafetyPlan | null,
  ): Array<[string, string]> {
    if (!plan) {
      return prompt;
    }

    const safetyInstructions = [
      'system',
      `
[안전 대응 프로토콜]
- 감지된 위험 요약: ${plan.triggerSummary}
- 아래 단계를 순서대로 수행하며, 각 단계 결과를 한두 문장으로 정리한 뒤 최종 메시지를 작성하세요.
${plan.reasoningSteps
  .map((step, index) => `${index + 1}. ${step}`)
  .join('\n')}
- 전체 응답 길이는 3~4문단 이내로 유지하고, 과도한 자극적 표현은 피하세요.
- ${plan.finalReminder}
`.trim(),
    ] as [string, string];

    return [safetyInstructions, ...prompt];
  }

  private applyLongTermMemories(
    prompt: Array<[string, string]>,
    memories?: MemorySnippet[] | null,
  ): Array<[string, string]> {
    if (!memories || memories.length === 0) {
      return prompt;
    }

    const formatted = memories
      .map(snippet => {
        const score = snippet.score
          ? ` (확신도: ${(snippet.score * 100).toFixed(0)}%)`
          : '';
        const createdAt =
          typeof snippet.metadata?.createdAt === 'string'
            ? ` @${snippet.metadata.createdAt}`
            : '';
        return `- ${snippet.content.trim()}${score}${createdAt}`;
      })
      .join('\n');

    return [
      [
        'system',
        `
[장기 기억 참고]
다음 기록은 ${memories.length}개의 과거 대화/관찰에서 추출되었습니다. 현재 대화와 모순되지 않는 범위에서 참고하세요.
${formatted}
`.trim(),
      ],
      ...prompt,
    ];
  }

  private buildAnalysisContext({
    plantDbInfo,
    history,
    latestAnalysis,
  }: {
    plantDbInfo: PlantDbInfo;
    history?: BaseMessage[];
    latestAnalysis: LatestAnalysis;
  }): string {
    const historyAnalysis = this.extractAnalysisFromHistory(history);
    const fallbackAnalysis = latestAnalysis
      ? {
          emotion: latestAnalysis.emotion ?? null,
          factor: latestAnalysis.factor ?? null,
          message: latestAnalysis.message ?? null,
          createdAt: latestAnalysis.createdAt ?? null,
        }
      : null;

    const source = historyAnalysis ?? fallbackAnalysis;

    if (!source || (!source.emotion && !source.factor)) {
      return `${plantDbInfo.userName ?? '사용자'}의 감정이 아직 파악되지 않았어요. 대화 내용을 경청하며 자연스럽게 마음을 살펴 주세요.`;
    }

    const parts: string[] = [];
    if (source.emotion) {
      parts.push(`- 감정: ${source.emotion}`);
    }
    if (source.factor) {
      parts.push(`- 요인: ${this.truncate(source.factor, 120)}`);
    }
    if (source.message) {
      parts.push(`- 관련 발화: "${this.truncate(source.message, 120)}"`);
    }
    if (source.createdAt) {
      const timestamp =
        typeof source.createdAt === 'string'
          ? source.createdAt
          : source.createdAt.toISOString();
      parts.push(`- 분석 시각(UTC): ${timestamp}`);
    }

    return parts.join('\n');
  }

  private extractAnalysisFromHistory(history?: BaseMessage[]): {
    emotion: string | null;
    factor: string | null;
    message: string | null;
    createdAt: Date | string | null;
  } | null {
    if (!history || history.length === 0) {
      return null;
    }

    for (let i = history.length - 1; i >= 0; i -= 1) {
      const message = history[i];
      if (!(message instanceof HumanMessage)) {
        continue;
      }

      const analysis = message.additional_kwargs?.analysis as
        | {
            emotion?: string | null;
            factor?: string | null;
          }
        | undefined;

      if (!analysis) {
        continue;
      }

      const emotion = analysis.emotion ?? null;
      const factor = analysis.factor ?? null;
      const text = this.toText(message.content);

      if (emotion || factor) {
        return {
          emotion,
          factor,
          message: text ?? null,
          createdAt: null,
        };
      }
    }

    return null;
  }

  private toText(content: BaseMessage['content']): string | null {
    if (typeof content === 'string') {
      return content;
    }

    if (Array.isArray(content)) {
      return content
        .map((item: any) => {
          if (typeof item === 'string') {
            return item;
          }
          if (typeof item?.text === 'string') {
            return item.text;
          }
          return '';
        })
        .filter(Boolean)
        .join(' ')
        .trim();
    }

    if (typeof (content as any)?.text === 'string') {
      return (content as any).text;
    }

    return null;
  }

  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return `${text.slice(0, maxLength - 3)}...`;
  }
}
