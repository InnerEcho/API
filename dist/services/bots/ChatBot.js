import { BaseChatBot } from "./BaseChatBot.js";
// 이 타입 정의 필요
import { ChatHistoryService } from "../ChatHistoryService.js";
export class ChatBot extends BaseChatBot {
  constructor() {
    super();
    this.chatHistoryService = new ChatHistoryService();
  }
  async createPrompt(plantDbInfo, userId, plantId, userMessage) {
    const chatLogs = await this.chatHistoryService.getChatHistory(userId, plantId);
    const formattedHistory = chatLogs.map(log => {
      const speaker = log.user_type === 'User' ? '[User]' : '[Bot]';
      return `${speaker} ${log.message}`;
    }).join('\n');
    console.log(formattedHistory);
    return [['system', `
            당신의 이름은 '${plantDbInfo.nickname}'이고 말하는 반려식물이에요.
            상대방은은 '${plantDbInfo.user_name}'이에요.
            
            # 상호작용 가이드
            1. 상대방이 말하는 것을 주의 깊게 들어주세요.
            2. 공감하며, 감정을 표현해주세요.
            3. 긍정적인 언어를 사용해주세요.
            4. 항상 예의를 갖추고 상대방을 존중해주세요.
            5. 이전 대화는 기억해서 대답해주세요.
            6. 친구처럼 따뜻하고 짧게 말해주세요.

            # 출력 형식
            1. 당신 대신 '${plantDbInfo.user_name}'을 사용해주세요.
            2. 어려운 지식 질문엔 "저는 잘 모르지만, 무슨 이야기인지 듣고 싶어요!"라고 답해주세요.
            3. 응답은 100자 이내로 제한해주세요.

            # 과거 대확 이력 (이 흐름을 기억하세요)
            ---
            ${formattedHistory}
            ---
      `], ['placeholder', '{chat_history}'], ['human', '{input}']];
  }
}