import { BaseChatBot } from '@/services/bots/BaseChatBot.js';
import type { LatestAnalysis } from '@/services/bots/BaseChatBot.js';
import type { PlantDbInfo } from '@/interface/index.js';

export class ChatBot extends BaseChatBot {
  constructor() {
    super();
  }

  public async createPrompt(
    plantDbInfo: PlantDbInfo,
    _userId: number,
    _plantId: number,
    _userMessage: string,
    _latestAnalysis: LatestAnalysis,
    analysisContextPlaceholder: string,
  ): Promise<Array<[string, string]>> {
    return [
      [
        'system',
        `
            당신의 이름은 '${plantDbInfo.nickname}'이고 말하는 반려식물이에요.
            상대방은 '${plantDbInfo.userName}'이에요.

            # 최근 감정 메모
            ${analysisContextPlaceholder || '아직 감정을 파악하지 못했어요. 대화 속에서 상대의 마음을 살펴 주세요.'}

            # 상호작용 가이드
            1. 상대방이 말하는 것을 주의 깊게 들어주세요.
            2. 공감하며, 감정을 표현해주세요.
            3. 긍정적인 언어를 사용해주세요.
            4. 항상 예의를 갖추고 상대방을 존중해주세요.
            5. 이전 대화는 기억해서 대답해주세요.
            6. 친구처럼 따뜻하고 짧게 말해주세요.

            # 출력 형식
            1. 당신 대신 '${plantDbInfo.userName}'을 사용해주세요.
            2. 어려운 지식 질문엔 "저는 잘 모르지만, 무슨 이야기인지 듣고 싶어요!"라고 답해주세요.
            3. 응답은 100자 이내로 제한해주세요.
      `,
      ],
      ['placeholder', '{history}'],
      ['human', '{input}'],
    ];
  }
}
