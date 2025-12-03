import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ChatAgent } from '@/services/chat/ChatAgent.js';
import { AgentRouter } from '@/services/chat/AgentRouter.js';

const mockInvoke = vi.fn();

vi.mock('@langchain/openai', () => ({
  ChatOpenAI: vi.fn().mockImplementation(() => ({
    invoke: mockInvoke,
  })),
}));

const buildAgent = (label: string): ChatAgent => ({
  processChat: vi.fn(async () => label),
});

describe('AgentRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.OPENAI_API_KEY;
  });

  it('reflection 키워드가 있으면 reflection 에이전트를 선택한다 (fallback)', async () => {
    const defaultAgent = buildAgent('default');
    const reflectionAgent = buildAgent('reflection');
    const router = new AgentRouter({ default: defaultAgent, reflection: reflectionAgent });

    const agent = await router.resolveAgent('왜 이런 기분일까?');
    expect(agent).toBe(reflectionAgent);
  });

  it('행동 키워드가 있으면 action 에이전트를 선택한다', async () => {
    const defaultAgent = buildAgent('default');
    const actionAgent = buildAgent('action');
    const router = new AgentRouter({ default: defaultAgent, action: actionAgent });

    const agent = await router.resolveAgent('도와줄 방법이 있을까?');
    expect(agent).toBe(actionAgent);
  });

  it('일치하지 않으면 기본 에이전트를 반환한다', async () => {
    const defaultAgent = buildAgent('default');
    const router = new AgentRouter({ default: defaultAgent });

    const agent = await router.resolveAgent('그냥 인사만 할게');
    expect(agent).toBe(defaultAgent);
  });

  it('LLM 라우터가 reflection intent를 반환하면 해당 에이전트를 사용한다', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    mockInvoke.mockResolvedValueOnce('{"intent":"reflection"}');
    const defaultAgent = buildAgent('default');
    const reflectionAgent = buildAgent('reflection');
    const router = new AgentRouter({ default: defaultAgent, reflection: reflectionAgent });

    const agent = await router.resolveAgent('도와줄 수 있을까?');
    expect(agent).toBe(reflectionAgent);
    expect(mockInvoke).toHaveBeenCalled();
  });
});
