import { InMemoryChatMessageHistory } from '@langchain/core/chat_history';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableWithMessageHistory } from '@langchain/core/runnables';
import db from '../../models/index.js';
import type { PlantDbInfo } from '../../interface/chatbot.js';

// Sequelize 모델에서 ChatHistory 추출
const { ChatHistory } = db;

/**
 * 🌱 BaseChatBot (템플릿 메서드 패턴의 추상 클래스)
 * - 대화 처리의 공통 흐름을 고정
 * - 프롬프트 생성은 하위 클래스에 위임
 */
export abstract class BaseChatBot {
  // 사용자별 대화 이력을 메모리에 저장 (세션 기반)
  private messageHistories: Record<string, InMemoryChatMessageHistory> = {};

  /**
   * 🌱 대화 처리의 공통 템플릿 메서드
   * 1. 식물 정보 조회
   * 2. 프롬프트 생성 (하위 클래스에 위임)
   * 3. LLM 호출
   * 4. 대화 이력 관리
   * 5. 대화 결과 저장 및 반환
   */
  public async processChat(
    userId: number,
    plantId: number,
    userMessage: string,
  ): Promise<String> {
    // 1. 사용자 & 식물 정보 조회
    const plantDbInfoResult = await db.sequelize.query(
      `
        SELECT u.user_name, p.nickname, s.species_name
        FROM user u, plant p, species s
        WHERE u.user_id = ${userId} AND p.plant_id = ${plantId} AND p.species_id = s.species_id;
      `,
      { type: db.Sequelize.QueryTypes.SELECT },
    );

    if (!plantDbInfoResult || plantDbInfoResult.length === 0) {
      throw new Error('Not Exists Chatbot DB');
    }

    const plantDbInfo = plantDbInfoResult[0];

    // 2. 프롬프트 생성 (하위 클래스에서 정의)
    const prompt = await this.createPrompt(
      plantDbInfo,
      userId,
      plantId,
      userMessage,
    );

    // 3. LLM 인스턴스 생성
    const llm = new ChatOpenAI({
      model: 'gpt-4o',
      apiKey: process.env.OPENAI_API_KEY!,
    });

    // 4. LLM 호출 체인 구성
    const userMessageTemplate = ChatPromptTemplate.fromMessages(prompt);
    const outputParser = new StringOutputParser();
    const llmChain = userMessageTemplate.pipe(llm).pipe(outputParser);

    // 5. 대화 이력 관리 설정
    const historyChain = new RunnableWithMessageHistory({
      runnable: llmChain,
      getMessageHistory: async sessionId => {
        if (!this.messageHistories[sessionId]) {
          this.messageHistories[sessionId] = new InMemoryChatMessageHistory();
        }
        return this.messageHistories[sessionId];
      },
      inputMessagesKey: 'input',
      historyMessagesKey: 'chat_history',
    });

    // 6. LLM 호출 실행
    const config = { configurable: { sessionId: userId } };
    const botReply = await historyChain.invoke({ input: userMessage }, config);

    return botReply;
  }

  /**
   * 🌱 프롬프트 생성 메서드 (하위 클래스에서 반드시 구현)
   * @param plantDbInfo - 사용자와 식물 정보
   * @param userMessage - 사용자 입력 메시지
   */
  protected abstract createPrompt(
    plantDbInfo: PlantDbInfo,
    userId: number,
    plantId: number,
    userMessage: string,
  ): Promise<Array<[string, string]>>;
}
