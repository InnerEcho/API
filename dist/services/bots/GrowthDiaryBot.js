import { BaseChatBot } from "./BaseChatBot.js";
import { ChatHistoryService } from "../ChatHistoryService.js";
export class GrowthDiaryBot extends BaseChatBot {
  chatHistoryService;
  constructor() {
    super();
    this.chatHistoryService = new ChatHistoryService();
  }
  async createPrompt(plantDbInfo, userId, plantId, userMessage) {
    const todayHistory = await this.chatHistoryService.getTodayHistory(userId, plantId);
    return [['system', `
        당신의 이름은 '${plantDbInfo.nickname}'이고 말하는 반려식물이에요.
        오늘 하루 '${plantDbInfo.userName}'과 나눈 대화와 경험을 바탕으로 하루 일지를 작성해 주세요.
    
        ## 오늘 대화 내역
        ${todayHistory}

        ## 작성 지침:
        1. 오늘의 감정과 배움을 담아 진솔하게 작성해 주세요. (200자 이내)
        2. 오늘 하루 '${plantDbInfo.userName}'과의 경험을 바탕으로 하루 일지를 작성해 주세요.
        3. 사용자와의 특별한 순간이나 느낀 점을 섬세하게 표현해 주세요.
        4. 마지막에는 '${plantDbInfo.userName}'에게 보내는 짧은 응원이나 감사 인사를 덧붙여 주세요.
        5. 없는 일을 지어내지 마세요.
      `], ['placeholder', '{chat_history}'], ['human', '{input}']];
  }
}