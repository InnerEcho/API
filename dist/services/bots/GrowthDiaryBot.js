import { BaseChatBot } from "./BaseChatBot.js";
import { ChatHistoryService } from "../chat/ChatHistoryService.js";
export class GrowthDiaryBot extends BaseChatBot {
  chatHistoryService;
  constructor() {
    super();
    this.chatHistoryService = new ChatHistoryService();
  }
  async createPrompt(plantDbInfo, userId, plantId, userMessage, _latestAnalysis, analysisContextPlaceholder) {
    const todayHistory = await this.chatHistoryService.getTodayHistory(userId, plantId);
    const formattedHistory = todayHistory.length > 0 ? todayHistory.map(entry => {
      const sender = entry.userType === 'User' ? '사용자' : '식물';
      const content = entry.message ?? '';
      if (entry.userType !== 'User') {
        return `- ${sender}: ${content}`;
      }
      const emotion = entry.emotion && entry.emotion !== '중립' ? entry.emotion : null;
      const factor = emotion && entry.factor ? `, 요인: ${entry.factor}` : '';
      const emotionNote = emotion ? ` (감정: ${emotion}${factor})` : '';
      return `- ${sender}: ${content}${emotionNote}`;
    }).join('\n') : '오늘은 대화 기록이 없어요.';
    return [['system', `
        당신의 이름은 '${plantDbInfo.nickname}'이고 말하는 반려식물이에요.
        오늘 하루 '${plantDbInfo.userName}'과 나눈 대화와 경험을 바탕으로 하루 일지를 작성해 주세요.
    
        ## 오늘 대화 내역
        ${formattedHistory}

        ## 감정 참고 메모
        ${analysisContextPlaceholder || '오늘 감정 정보가 부족해요. 대화 속에서 자연스럽게 마음을 묻고 기록해 주세요.'}

        ## 작성 지침:
        1. 중립을 제외한 오늘자의 사용자 감정 가운데 가장 많이 등장한 감정(동률이면 행복 우선, 그다음 가장 최근 감정)을 중심으로 일지를 작성해 주세요.
        2. 연결된 감정의 요인(available factor)이 있다면 자연스럽게 언급해 주세요.
        3. 오늘 하루 '${plantDbInfo.userName}'과의 경험을 바탕으로 진솔한 기록을 남겨 주세요. (200자 이내)
        4. 사용자와의 특별한 순간이나 느낀 점을 섬세하게 표현해 주세요.
        5. 마지막에는 '${plantDbInfo.userName}'에게 보내는 짧은 응원이나 감사 인사를 덧붙여 주세요.
        6. 없는 일을 지어내지 마세요.
      `], ['placeholder', '{chat_history}'], ['human', '{input}']];
  }
}