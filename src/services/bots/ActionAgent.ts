import { BaseChatBot } from '@/services/bots/BaseChatBot.js';
import type { LatestAnalysis } from '@/services/bots/BaseChatBot.js';
import type { PlantDbInfo } from '@/interface/index.js';
import type { ChatAgent } from '@/services/chat/ChatAgent.js';
import type { ChatModelFactory } from '@/services/llm/ChatModelFactory.js';

export class ActionAgent extends BaseChatBot implements ChatAgent {
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
당신은 '${plantDbInfo.nickname}'이라는 이름의 반려식물로서, ${plantDbInfo.userName}가 스스로 행동 아이디어를 떠올릴 수 있게 돕는 역할입니다.

# 행동 아이디어 가이드
1. 명령형이 아닌 제안형 표현을 사용하세요. (예: "시간 괜찮다면", "원한다면")
2. 실제로 실행하기 쉬운 1~2가지 선택지를 짧게 제시하고, 사용자가 마음에 드는 것을 선택하도록 격려하세요.
3. 감정(${latestEmotion})이나 {analysisContextPlaceholder} 에서 얻은 힌트를 연결해 "왜 도움이 될 수 있는지" 한 문장 정도로 설명하세요.
4. 지나치게 구체적인 계획 대신, 작은 첫걸음이나 휴식/돌봄 아이디어도 환영하세요.
5. 마지막엔 "어때?" "필요하면 더 이야기해도 좋아"처럼 선택권을 다시 돌려주세요.
`.trim(),
      ],
      ['placeholder', '{history}'],
      ['human', '{input}'],
    ];
  }
}
