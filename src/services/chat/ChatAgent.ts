export type SafetyPlan = {
  triggerSummary: string;
  reasoningSteps: string[];
  finalReminder: string;
};

export type ChatAgentOptions = {
  storeHistory?: boolean;
  safetyPlan?: SafetyPlan | null;
};

export interface ChatAgent {
  processChat(
    userId: number,
    plantId: number,
    message: string,
    options?: ChatAgentOptions,
  ): Promise<string>;
}
