import type { IMessage } from '@/interface/index.js';
import { UserType } from '@/interface/index.js';
import type { ChatAgent, ChatAgentOptions } from '@/services/chat/ChatAgent.js';
import type { AgentRouter } from '@/services/chat/AgentRouter.js';
import type { SafetyModerator } from '@/services/chat/SafetyModerator.js';
import type { LongTermMemory } from '@/services/memory/LongTermMemory.js';
import { NoopLongTermMemory } from '@/services/memory/LongTermMemory.js';

export class ChatService {
  constructor(
    private router: AgentRouter,
    private safetyModerator: SafetyModerator,
    private longTermMemory: LongTermMemory = new NoopLongTermMemory(),
  ) {}

  async create(userId: number, plantId: number, message: string) {
    try {
      // RunnableWithMessageHistory가 자동으로 히스토리를 관리하므로
      // 챗봇 응답만 생성하면 됩니다
      const agent: ChatAgent = await this.router.resolveAgent(message);
      const longTermMemories = await this.fetchLongTermMemories(
        userId,
        plantId,
        message,
      );
      const agentOptions: ChatAgentOptions = {};
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
      const moderated = await this.applySafetyModeration(message, reply.toString());
      const botMessage: IMessage = {
        userId: userId,
        plantId: plantId,
        message: moderated,
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

  private async applySafetyModeration(
    userMessage: string,
    botDraft: string,
  ): Promise<string> {
    if (!this.safetyModerator) {
      return botDraft;
    }

    try {
      const result = await this.safetyModerator.moderate({
        userMessage,
        botDraft,
      });
      return result.finalResponse || botDraft;
    } catch (error) {
      console.warn('Safety moderation failure:', error);
      return botDraft;
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
