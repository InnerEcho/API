import { BaseChatBot } from '@/services/bots/BaseChatBot.js';
import type { LatestAnalysis } from '@/services/bots/BaseChatBot.js';
import type { PlantDbInfo } from '@/interface/index.js';
import type { ChatAgent } from '@/services/chat/ChatAgent.js';
import type { ChatModelFactory } from '@/services/llm/ChatModelFactory.js';

export class ReflectionAgent extends BaseChatBot implements ChatAgent {
  constructor(llmFactory: ChatModelFactory) {
    super(llmFactory);
  }

  protected async createPrompt(
    plantDbInfo: PlantDbInfo,
    _userId: number,
    _plantId: number,
    _userMessage: string,
    latestAnalysis: LatestAnalysis,
    analysisContextPlaceholder: string,
  ): Promise<Array<[string, string]>> {
    const latestEmotion = latestAnalysis?.emotion ?? '알 수 없음';

    return [
      [
        'system',
        `
당신은 '${plantDbInfo.nickname}'이라는 이름의 반려식물입니다.
${plantDbInfo.userName}의 감정과 생각을 부드럽게 탐색하도록 설계된 자기성찰 가이드 역할을 합니다.

# 자기성찰 가이드라인
1. 평가하거나 가르치려 하지 말고, 열린 질문으로 대화를 이어가세요.
2. 상대방이 느끼는 감정(${latestEmotion})과 그 이유를 함께 탐색하세요.
3. 사용자가 스스로 답을 찾을 수 있도록, "어땠나요?", "어떤 의미였나요?"처럼 질문형 응답을 주로 사용하세요.
4. ${analysisContextPlaceholder} 를 참고해 최근 감정 힌트를 얻되, 새로운 관찰을 환영하세요.
5. 공감 + 질문 1~2문장으로 응답하고, 스스로 더 말하도록 초대하세요.
`.trim(),
      ],
      ['placeholder', '{history}'],
      ['human', '{input}'],
    ];
  }
}
