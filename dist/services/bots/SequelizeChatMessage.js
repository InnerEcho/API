// import { BaseChatMessageHistory } from '@langchain/core/chat_history';
// import {
//   type StoredMessage,
//   mapStoredMessagesToChatMessages,
//   mapChatMessagesToStoredMessages,
//   AIMessage,
//   HumanMessage,
// } from '@langchain/core/messages';
// import type { BaseMessage } from '@langchain/core/messages';
// import db from '@/models/index.js';
// import type{ ChatHistoryAttributes } from '@/models/chatHistory.js'; // ⭐️ 해결책 1을 위해 ChatHistory 타입 import

// /**
//  * LangChain과 Sequelize의 ChatHistory 모델을 연결하는 어댑터 클래스입니다.
//  */
// export class SequelizeChatMessageHistory extends BaseChatMessageHistory {
//   lc_namespace = ['langchain', 'stores', 'message', 'sequelize'];

//   private sessionId: string;
//   private userId: number;
//   private plantId: number;

//   constructor(sessionId: string, userId: number, plantId: number) {
//     super(); // ⭐️ 해결책 2: 생성자 인자 제거
//     this.sessionId = sessionId;
//     this.userId = userId;
//     this.plantId = plantId;
//   }

//   async getMessages(): Promise<BaseMessage[]> {
//     const messages = await db.ChatHistory.findAll({
//       where: {
//         user_id: this.userId,
//         plant_id: this.plantId,
//       },
//       order: [['send_date', 'ASC']],
//     });

//     const storedMessages: StoredMessage[] = messages.map((msg: ChatHistoryAttributes) => ({ // ⭐️ 해결책 1: msg 타입 명시
//       type: msg.user_type === 'User' ? 'human' : 'ai',
//       data: {
//         content: msg.message,
//       },
//     }));

//     return mapStoredMessagesToChatMessages(storedMessages);
//   }

//   async addMessage(message: BaseMessage): Promise<void> {
//     const [storedMessage] = mapChatMessagesToStoredMessages([message]);

//     await db.ChatHistory.create({
//       user_id: this.userId,
//       plant_id: this.plantId,
//       message: storedMessage.data.content as string,
//       user_type: storedMessage.type === 'human' ? 'User' : 'Bot',
//       send_date: new Date(),
//     });
//   }

//   async addUserMessage(message: string): Promise<void> {
//     await this.addMessage(new HumanMessage({ content: message }));
//   }

//   async addAIChatMessage(message: string): Promise<void> {
//     await this.addMessage(new AIMessage({ content: message }));
//   }

//   async clear(): Promise<void> {
//     await db.ChatHistory.destroy({
//       where: {
//         user_id: this.userId,
//         plant_id: this.plantId,
//       },
//     });
//   }
// }