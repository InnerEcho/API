import db from "../../models/index.js";
import { RunnableWithMessageHistory, RunnablePassthrough } from '@langchain/core/runnables';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { HumanMessage } from '@langchain/core/messages';
import { AnalysisService } from "../AnalysisService.js";
import { RedisChatMessageHistory } from "./RedisChatMessageHistory.js";
export class BaseChatBot {
  analysisService;
  constructor() {
    this.analysisService = new AnalysisService();
  }
  async processChat(userId, plantId, userMessage) {
    // Sequelize 모델을 사용하여 user, plant, species 정보를 JOIN
    const plant = await db.Plant.findOne({
      where: {
        user_id: userId,
        plant_id: plantId
      },
      include: [{
        model: db.User,
        as: 'user',
        attributes: ['user_name']
      }, {
        model: db.Species,
        as: 'species',
        attributes: ['species_name']
      }]
    });
    if (!plant) {
      throw new Error('식물 정보를 찾을 수 없습니다.');
    }

    // PlantDbInfo 형식으로 변환
    const plantDbInfo = {
      userName: plant.get('user')?.user_name,
      nickname: plant.get('nickname'),
      speciesName: plant.get('species')?.species_name
    };
    const latestAnalysis = await this.analysisService.getLatestUserAnalysis(userId);
    const analysisContextVariable = 'analysisContext';
    const analysisContextPlaceholder = `{${analysisContextVariable}}`;
    const prompt = await this.createPrompt(plantDbInfo, userId, plantId, userMessage, latestAnalysis, analysisContextPlaceholder);
    const llm = new ChatOpenAI({
      model: 'gpt-4o',
      apiKey: process.env.OPENAI_API_KEY
    });
    const userMessageTemplate = ChatPromptTemplate.fromMessages(prompt);
    const outputParser = new StringOutputParser();
    const llmChain = RunnablePassthrough.assign({
      analysisContext: ({
        history
      }) => this.buildAnalysisContext({
        plantDbInfo,
        history,
        latestAnalysis
      })
    }).pipe(userMessageTemplate).pipe(llm).pipe(outputParser);

    // 2. RunnableWithMessageHistory 설정 변경
    const historyChain = new RunnableWithMessageHistory({
      runnable: llmChain,
      getMessageHistory: sessionId => {
        // sessionId를 파싱하여 userId와 plantId를 추출합니다.
        const [uid, pid] = sessionId.split('-').map(Number);
        if (isNaN(uid) || isNaN(pid)) {
          throw new Error(`잘못된 sessionId 형식입니다. "userId-plantId"가 필요합니다: "${sessionId}"`);
        }
        // 명확하게 분리된 인자를 생성자에 전달합니다.
        return new RedisChatMessageHistory(uid, pid);
      },
      inputMessagesKey: 'input',
      historyMessagesKey: 'history'
    });

    // 3. sessionId를 "userId-plantId" 조합으로 생성
    const sessionId = `${userId}-${plantId}`;
    const result = await historyChain.invoke({
      input: userMessage
    }, {
      configurable: {
        sessionId: sessionId
      }
    });
    return result;
  }
  buildAnalysisContext({
    plantDbInfo,
    history,
    latestAnalysis
  }) {
    const historyAnalysis = this.extractAnalysisFromHistory(history);
    const fallbackAnalysis = latestAnalysis ? {
      emotion: latestAnalysis.emotion ?? null,
      factor: latestAnalysis.factor ?? null,
      message: latestAnalysis.message ?? null,
      createdAt: latestAnalysis.createdAt ?? null
    } : null;
    const source = historyAnalysis ?? fallbackAnalysis;
    if (!source || !source.emotion && !source.factor) {
      return `${plantDbInfo.userName ?? '사용자'}의 감정이 아직 파악되지 않았어요. 대화 내용을 경청하며 자연스럽게 마음을 살펴 주세요.`;
    }
    const parts = [];
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
      const timestamp = typeof source.createdAt === 'string' ? source.createdAt : source.createdAt.toISOString();
      parts.push(`- 분석 시각(UTC): ${timestamp}`);
    }
    return parts.join('\n');
  }
  extractAnalysisFromHistory(history) {
    if (!history || history.length === 0) {
      return null;
    }
    for (let i = history.length - 1; i >= 0; i -= 1) {
      const message = history[i];
      if (!(message instanceof HumanMessage)) {
        continue;
      }
      const analysis = message.additional_kwargs?.analysis;
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
          createdAt: null
        };
      }
    }
    return null;
  }
  toText(content) {
    if (typeof content === 'string') {
      return content;
    }
    if (Array.isArray(content)) {
      return content.map(item => {
        if (typeof item === 'string') {
          return item;
        }
        if (typeof item?.text === 'string') {
          return item.text;
        }
        return '';
      }).filter(Boolean).join(' ').trim();
    }
    if (typeof content?.text === 'string') {
      return content.text;
    }
    return null;
  }
  truncate(text, maxLength) {
    if (text.length <= maxLength) {
      return text;
    }
    return `${text.slice(0, maxLength - 3)}...`;
  }
}