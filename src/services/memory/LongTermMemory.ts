export type MemorySnippet = {
  id: string;
  content: string;
  score?: number;
  metadata?: Record<string, unknown>;
};

export interface LongTermMemory {
  retrieveContext(
    userId: number,
    plantId: number,
    query: string,
  ): Promise<MemorySnippet[]>;

  remember(
    userId: number,
    plantId: number,
    content: string,
    metadata?: Record<string, unknown>,
  ): Promise<void>;
}

export class NoopLongTermMemory implements LongTermMemory {
  async retrieveContext(): Promise<MemorySnippet[]> {
    return [];
  }

  async remember(): Promise<void> {
    return undefined;
  }
}
