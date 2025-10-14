import db from "../../models/index.js";
import { EmotionService } from "../EmotionService.js";
import { RunnableWithMessageHistory } from '@langchain/core/runnables';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RedisChatMessageHistory } from "./RedisChatMessageHistory.js";
export class BaseChatBot {
  constructor() {
    this.emotionService = new EmotionService();
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
    const prompt = await this.createPrompt(plantDbInfo, userId, plantId, userMessage);
    const llm = new ChatOpenAI({
      model: 'gpt-4o',
      apiKey: process.env.OPENAI_API_KEY
    });
    const userMessageTemplate = ChatPromptTemplate.fromMessages(prompt);
    const outputParser = new StringOutputParser();
    const llmChain = userMessageTemplate.pipe(llm).pipe(outputParser);

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
}