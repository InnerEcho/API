import { describe, it, expect, vi } from 'vitest';
import { UpstashVectorMemory } from '@/services/memory/UpstashVectorMemory.js';

vi.mock('@upstash/vector', () => ({
  Index: class {
    constructor() {}
  },
}));

const embeddingsStub = {
  embedQuery: vi.fn(),
};

const buildIndex = () => ({
  query: vi.fn(),
  upsert: vi.fn(),
});

describe('UpstashVectorMemory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('score가 임계값 이상인 기억만 반환한다', async () => {
    const index = buildIndex();
    embeddingsStub.embedQuery.mockResolvedValue([0.1, 0.2]);
    index.query.mockResolvedValue({
      matches: [
        {
          id: 'a',
          score: 0.8,
          metadata: { content: '첫번째 기억' },
        },
        {
          id: 'b',
          score: 0.6,
          metadata: { content: '두번째 기억' },
        },
      ],
    });

    const memory = new UpstashVectorMemory(index as any, embeddingsStub as any, {
      topK: 5,
      minSimilarity: 0.7,
    });

    const results = await memory.retrieveContext(1, 2, '기억해?');

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ id: 'a', content: '첫번째 기억' });
    expect(index.query).toHaveBeenCalledWith(
      expect.objectContaining({
        topK: 5,
        includeMetadata: true,
        filter: {
          userId: '1',
          plantId: '2',
        },
      }),
    );
  });

  it('remember는 임베딩을 생성해 upsert한다', async () => {
    const index = buildIndex();
    embeddingsStub.embedQuery.mockResolvedValue([0.5, 0.9]);
    const memory = new UpstashVectorMemory(index as any, embeddingsStub as any);

    await memory.remember(3, 4, '오늘 엄청 행복했어', { tag: 'emotion' });

    expect(index.upsert).toHaveBeenCalledTimes(1);
    const [payload] = index.upsert.mock.calls[0];
    expect(payload[0].metadata).toMatchObject({
      userId: '3',
      plantId: '4',
      content: '오늘 엄청 행복했어',
      tag: 'emotion',
    });
  });
});
