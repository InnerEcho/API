import type { IMessage } from '@/interface/index.js';
import { UserType } from '@/interface/index.js';
import type { ChatAgent, ChatAgentOptions } from '@/services/chat/ChatAgent.js';
import type { AgentRouter } from '@/services/chat/AgentRouter.js';
import { DepressionSafetyGuard } from '@/services/chat/DepressionSafetyGuard.js';
import type { LongTermMemory } from '@/services/memory/LongTermMemory.js';
import { NoopLongTermMemory } from '@/services/memory/LongTermMemory.js';

export class ChatService {
  constructor(
    private router: AgentRouter,
    private safetyGuard: DepressionSafetyGuard = new DepressionSafetyGuard(),
    private longTermMemory: LongTermMemory = new NoopLongTermMemory(),
  ) {}

  async create(userId: number, plantId: number, message: string) {
    try {
      // RunnableWithMessageHistory가 자동으로 히스토리를 관리하므로
      // 챗봇 응답만 생성하면 됩니다
      const agent: ChatAgent = await this.router.resolveAgent(message);
      const safetyPlan = await this.buildSafetyPlan(message);
      const longTermMemories = await this.fetchLongTermMemories(
        userId,
        plantId,
        message,
      );
      const agentOptions: ChatAgentOptions = {};
      if (safetyPlan) {
        agentOptions.safetyPlan = safetyPlan;
      }
      if (longTermMemories.length > 0) {
        agentOptions.longTermMemories = longTermMemories;
      }
      const reply = await agent.processChat(
        userId,
        plantId,
        message,
        Object.keys(agentOptions).length > 0 ? agentOptions : undefined,
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
    } finally {
      await this.rememberInteraction(userId, plantId, message);
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

  private async fetchLongTermMemories(
    userId: number,
    plantId: number,
    message: string,
  ) {
    if (!this.longTermMemory) {
      return [];
    }

    try {
      return (
        (await this.longTermMemory.retrieveContext(userId, plantId, message)) ??
        []
      );
    } catch (error) {
      console.warn('Long-term memory retrieval failure:', error);
      return [];
    }
  }

  private async rememberInteraction(
    userId: number,
    plantId: number,
    message: string,
  ): Promise<void> {
    if (!this.longTermMemory || !this.shouldRemember(message)) {
      return;
    }

    try {
      await this.longTermMemory.remember(userId, plantId, message, {
        source: 'user_message',
      });
    } catch (error) {
      console.warn('Long-term memory failure:', error);
    }
  }

  private shouldRemember(message: string): boolean {
    const normalized = message?.trim();
    return Boolean(normalized && normalized.length >= 20);
  }
}
