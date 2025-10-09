import { BaseChatMessageHistory } from '@langchain/core/chat_history';
import {
  AIMessage,
  HumanMessage,
  BaseMessage,
  mapChatMessagesToStoredMessages,
} from '@langchain/core/messages';
  import db from '@/models/index.js';
  
  const { ChatHistory } = db;
  
export class SequelizeChatMessageHistory extends BaseChatMessageHistory {
  lc_namespace = ['langchain', 'stores', 'message', 'sequelize'];
  private userId: number;
  private plantId: number;

  // sessionId 문자열 대신, 필요한 데이터를 명확하게 받아 의존성을 낮춥니다.
  constructor(userId: number, plantId: number) {
    super();
    this.userId = userId;
    this.plantId = plantId;
  }
  
    /**
     * DB에서 최신 대화 기록 20개를 가져옵니다.
     */
    async getMessages(): Promise<BaseMessage[]> {
      try {
        // 대화가 길어지더라도 성능을 유지하기 위해 최신 20개만 조회합니다.
        const histories = await ChatHistory.findAll({
          where: {
            user_id: this.userId,
            plant_id: this.plantId,
          },
          order: [['send_date', 'DESC']], // 최신순으로 정렬
          limit: 20,
        });
  
        // DB에서는 최신순(DESC)으로 가져왔으므로, 시간순(ASC)으로 다시 뒤집어줍니다.
        const reversedHistories = histories.reverse();
  
        // DB 스키마에 맞춰 LangChain 메시지 객체로 변환합니다.
        return reversedHistories.map((history: any) => {
          if (history.user_type === 'User') {
            return new HumanMessage(history.message);
          } else {
            return new AIMessage(history.message);
          }
        });
      } catch (error) {
        console.error('DB에서 메시지를 가져오는 중 오류 발생:', error);
        // 에러를 상위로 전파하여 호출한 쪽에서 처리하도록 합니다.
        throw error;
      }
    }
  
  /**
   * 단일 메시지를 추가합니다.
   */
  async addMessage(message: BaseMessage): Promise<void> {
    await this.addMessages([message]);
  }

  /**
   * 사용자 메시지를 추가합니다.
   */
  async addUserMessage(message: string): Promise<void> {
    await this.addMessage(new HumanMessage(message));
  }

  /**
   * AI 메시지를 추가합니다.
   */
  async addAIChatMessage(message: string): Promise<void> {
    await this.addMessage(new AIMessage(message));
  }

  /**
   * 새로운 메시지들을 DB에 한 번의 쿼리로 저장합니다.
   */
  async addMessages(messages: BaseMessage[]): Promise<void> {
    try {
      const storedMessages = mapChatMessagesToStoredMessages(messages);

      const recordsToCreate = storedMessages.map((message: any) => ({
        user_id: this.userId,
        plant_id: this.plantId,
        message: message.data.content,
        user_type: message.type === 'User' ? 'User' : 'Bot',
        send_date: new Date(),
      }));

      // bulkCreate를 사용하여 여러 메시지를 한 번의 쿼리로 효율적으로 저장합니다.
      if (recordsToCreate.length > 0) {
        await ChatHistory.bulkCreate(recordsToCreate);
      }
    } catch (error) {
      console.error('DB에 메시지를 추가하는 중 오류 발생:', error);
      // 에러를 상위로 전파합니다.
      throw error;
    }
  }
  
    /**
     * 해당 유저와 식물의 대화 기록을 모두 삭제합니다.
     */
    async clear(): Promise<void> {
      try {
        await ChatHistory.destroy({
          where: {
            user_id: this.userId,
            plant_id: this.plantId,
          },
        });
      } catch (error) {
        console.error('DB에서 메시지를 삭제하는 중 오류 발생:', error);
        throw error;
      }
    }
  }