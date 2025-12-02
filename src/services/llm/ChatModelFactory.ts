import { ChatOpenAI } from '@langchain/openai';

export interface ChatModelFactory {
  create(): ChatOpenAI;
}

export type ChatModelFactoryConfig = {
  model: string;
  temperature?: number;
};

export class LangchainChatModelFactory implements ChatModelFactory {
  constructor(
    private readonly config: ChatModelFactoryConfig = {
      model: 'gpt-4o',
      temperature: 0.7,
    },
  ) {}

  create(): ChatOpenAI {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    return new ChatOpenAI({
      model: this.config.model,
      temperature: this.config.temperature ?? 0.7,
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
}
