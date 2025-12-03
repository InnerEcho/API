import { Index } from '@upstash/vector';
import type { EmbeddingsInterface } from '@langchain/core/embeddings';
import crypto from 'crypto';
import type { LongTermMemory, MemorySnippet } from '@/services/memory/LongTermMemory.js';

type UpstashVectorConfig = {
  topK: number;
  minSimilarity: number;
};

type QueryMatch = {
  id: string;
  score?: number;
  metadata?: Record<string, any>;
};

export class UpstashVectorMemory implements LongTermMemory {
  private readonly index: Index;

  constructor(
    index: Index,
    private readonly embeddings: EmbeddingsInterface,
    private readonly config: UpstashVectorConfig = {
      topK: 3,
      minSimilarity: 0.78,
    },
  ) {
    this.index = index;
  }

  static fromEnv(
    embeddings: EmbeddingsInterface,
    config?: Partial<UpstashVectorConfig>,
  ): UpstashVectorMemory | null {
    const url = process.env.UPSTASH_VECTOR_REST_URL;
    const token = process.env.UPSTASH_VECTOR_REST_TOKEN;
    if (!url || !token) {
      return null;
    }

    const index = new Index({
      url,
      token,
    });

    return new UpstashVectorMemory(index, embeddings, {
      topK: config?.topK ?? 3,
      minSimilarity: config?.minSimilarity ?? 0.78,
    });
  }

  public async retrieveContext(
    userId: number,
    plantId: number,
    query: string,
  ): Promise<MemorySnippet[]> {
    const trimmed = query?.trim();
    if (!trimmed) {
      return [];
    }

    if (!this.index) {
      return [];
    }

    const vector = await this.embeddings.embedQuery(trimmed);
    const response = await this.index.query({
      topK: this.config.topK,
      vector,
      includeMetadata: true,
      includeVectors: false,
      filter: {
        userId: userId.toString(),
        plantId: plantId.toString(),
      },
    });

    const matches = (response?.matches ?? []) as QueryMatch[];

    return matches
      .filter(match => (match.score ?? 0) >= this.config.minSimilarity)
      .map(match => ({
        id: match.id,
        content:
          (match.metadata?.content as string | undefined) ??
          (match.metadata?.text as string | undefined) ??
          '',
        score: match.score,
        metadata: match.metadata ?? {},
      }))
      .filter(snippet => snippet.content.length > 0);
  }

  public async remember(
    userId: number,
    plantId: number,
    content: string,
    metadata: Record<string, unknown> = {},
  ): Promise<void> {
    const trimmed = content?.trim();
    if (!trimmed) {
      return;
    }

    if (!this.index) {
      return;
    }

    const vector = await this.embeddings.embedQuery(trimmed);
    const id = this.buildMemoryId(userId, plantId);

    await this.index.upsert([
      {
        id,
        vector,
        metadata: {
          userId: userId.toString(),
          plantId: plantId.toString(),
          content: trimmed,
          createdAt: new Date().toISOString(),
          ...metadata,
        },
      },
    ]);
  }

  private buildMemoryId(userId: number, plantId: number): string {
    const nonce = crypto.randomBytes(8).toString('hex');
    return `${userId}:${plantId}:${Date.now()}:${nonce}`;
  }
}
