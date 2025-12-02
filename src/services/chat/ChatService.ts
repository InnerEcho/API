import type { IMessage } from '@/interface/index.js';
import { UserType } from '@/interface/index.js';
import type { ChatAgent } from '@/services/chat/ChatAgent.js';
import type { AgentRouter } from '@/services/chat/AgentRouter.js';
import { DepressionSafetyGuard } from '@/services/chat/DepressionSafetyGuard.js';

export class ChatService {
  constructor(
    private router: AgentRouter,
    private safetyGuard: DepressionSafetyGuard = new DepressionSafetyGuard(),
  ) {}

  async create(userId: number, plantId: number, message: string) {
    try {
      // RunnableWithMessageHistory가 자동으로 히스토리를 관리하므로
      // 챗봇 응답만 생성하면 됩니다
      const agent: ChatAgent = await this.router.resolveAgent(message);
      const safetyPlan = await this.buildSafetyPlan(message);
      const reply = await agent.processChat(
        userId,
        plantId,
        message,
        safetyPlan ? { safetyPlan } : undefined,
      );

      // 응답용 메시지 객체 생성
      const botMessage: IMessage = {
        userId: userId,
        plantId: plantId,
        message: reply.toString(),
        sendDate: new Date(),
        userType: UserType.BOT,
      };

      return botMessage;
    } catch (error) {
      console.error('Chat service error:', error);
      throw error;
    }
  }

  private async buildSafetyPlan(message: string) {
    if (!this.safetyGuard) {
      return null;
    }

    try {
      return await this.safetyGuard.buildPlan(message);
    } catch (error) {
      console.warn('Safety guard failure:', error);
      return null;
    }
  }
}
