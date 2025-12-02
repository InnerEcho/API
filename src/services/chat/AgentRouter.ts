import type { ChatAgent } from '@/services/chat/ChatAgent.js';
import { ChatOpenAI } from '@langchain/openai';
import { StringOutputParser } from '@langchain/core/output_parsers';

interface AgentRegistry {
  default: ChatAgent;
  reflection?: ChatAgent;
  action?: ChatAgent;
}

type RouterResponse = {
  intent: 'default' | 'reflection' | 'action';
};

export class AgentRouter {
  private routerModel: ChatOpenAI | null = null;

  constructor(private readonly agents: AgentRegistry) {
    if (process.env.OPENAI_API_KEY) {
      this.routerModel = new ChatOpenAI({
        model: 'gpt-4o-mini',
        temperature: 0,
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  public async resolveAgent(message: string): Promise<ChatAgent> {
    if (this.routerModel) {
      const intent = await this.classifyIntent(message);
      if (intent === 'action' && this.agents.action) {
        return this.agents.action;
      }
      if (intent === 'reflection' && this.agents.reflection) {
        return this.agents.reflection;
      }
      return this.agents.default;
    }

    return this.fallbackRouting(message);
  }

  private async classifyIntent(message: string): Promise<RouterResponse['intent']> {
    const prompt = `문장을 읽고 다음 중 하나를 선택하세요: "default" (일반 공감), "reflection" (자기성찰 도움 요청), "action" (명시적 조언/도움 요청).
반드시 intent 키만 담긴 JSON({"intent":"reflection"})으로 답하세요.
문장: ${message}`;

    const parser = new StringOutputParser();
    const response = await this.routerModel!.invoke(prompt).then(parser.parse);

    try {
      const parsed = JSON.parse(response) as RouterResponse;
      if (parsed.intent === 'reflection' || parsed.intent === 'action') {
        return parsed.intent;
      }
      return 'default';
    } catch (error) {
      return 'default';
    }
  }

  private fallbackRouting(message: string): ChatAgent {
    const normalized = (message ?? '').toLowerCase();
    if (this.agents.action && this.hasActionIntent(normalized)) {
      return this.agents.action;
    }
    if (this.agents.reflection && this.hasReflectionIntent(normalized)) {
      return this.agents.reflection;
    }
    return this.agents.default;
  }

  private hasReflectionIntent(text: string): boolean {
    const keywords = ['왜', '생각', '느낀', '기억', '왜일까'];
    return keywords.some(keyword => text.includes(keyword));
  }

  private hasActionIntent(text: string): boolean {
    const keywords = ['조언해', '알려줘', '도와줘', '방법', '추천해 줘'];
    return keywords.some(keyword => text.includes(keyword));
  }
}
