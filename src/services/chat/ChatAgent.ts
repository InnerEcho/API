import type { MemorySnippet } from '@/services/memory/LongTermMemory.js';

export type SafetyPlan = {
  triggerSummary: string;
  reasoningSteps: string[];
  finalReminder: string;
};

export type ChatAgentOptions = {
  storeHistory?: boolean;
  safetyPlan?: SafetyPlan | null;
  longTermMemories?: MemorySnippet[];
};

export interface ChatAgent {
  processChat(
    userId: number,
    plantId: number,
    message: string,
    options?: ChatAgentOptions,
  ): Promise<string>;
}
