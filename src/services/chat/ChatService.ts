import type { IMessage } from '@/interface/index.js';
import { UserType } from '@/interface/index.js';
import type { ChatAgent } from '@/services/chat/ChatAgent.js';
import type { AgentRouter } from '@/services/chat/AgentRouter.js';

export class ChatService {
  constructor(private router: AgentRouter) {}

  async create(userId: number, plantId: number, message: string) {
    try {
      // RunnableWithMessageHistory가 자동으로 히스토리를 관리하므로
      // 챗봇 응답만 생성하면 됩니다
      const agent: ChatAgent = await this.router.resolveAgent(message);
      const reply = await agent.processChat(userId, plantId, message);

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
}
