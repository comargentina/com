import { describe, it, expect, vi, beforeEach } from 'vitest';

const runToolMock = vi.fn();
vi.mock('./chat-tools', () => ({
  runTool: (...a: unknown[]) => runToolMock(...a),
  toolDefinitions: () => '[]',
  listTools: () => [],
  buildUpdateNotesAction: (obsId: string, notes: string) => ({
    id: `update-notes-${obsId}`,
    label: { en: 'Update notes', es: 'Actualizar notas' },
    tool: 'chat_update_observation_notes',
    args: { observation_id: obsId, notes },
    requiresConfirmation: true,
    undoable: true,
  }),
}));

vi.mock('./supabase', () => ({
  getSupabase: () => ({
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
    },
  }),
  getSupabaseUrl: () => 'https://test.supabase.co',
  getSupabaseAnonKey: () => 'test-anon-key',
}));

import { streamChat } from './chat-engine';

function createSseResponse(chunks: string[], status = 200) {
  if (status !== 200) {
    return new Response(JSON.stringify({ ok: false, error: 'failed' }), { status });
  }
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      for (const c of chunks) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: c })}\n\n`));
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });
  return new Response(stream, { status: 200 });
}

beforeEach(() => {
  runToolMock.mockReset();
  vi.restoreAllMocks();
});

describe('streamChat (Gemini Flash SSE)', () => {
  it('streams pure prose from Gemini Flash when no tool call', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      createSseResponse(['Hello there friend, ', 'how can I help today?'])
    );

    const out: string[] = [];
    for await (const chunk of streamChat({ messages: [{ role: 'user', content: 'hi' }] })) {
      if (chunk.type === 'text') out.push(chunk.delta);
    }
    expect(out.join('')).toContain('Hello there friend, how can I help today?');
  });

  it('detects a tool call, dispatches, re-prompts, returns final prose', async () => {
    let fetchCount = 0;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      fetchCount++;
      if (fetchCount === 1) {
        return createSseResponse(['{"tool":"find_species","args":{"p_query":"magnolia"}}']);
      }
      return createSseResponse(['Found Magnolia grandiflora in the seeded list.']);
    });
    runToolMock.mockResolvedValue({ ok: true, data: [{ scientific_name: 'Magnolia grandiflora' }] });

    const events: Array<{ type: string; delta?: string; tool?: string }> = [];
    for await (const chunk of streamChat({ messages: [{ role: 'user', content: 'find magnolia' }] })) {
      events.push(chunk);
    }
    expect(events.find(e => e.type === 'tool_call')?.tool).toBe('find_species');
    expect(events.filter(e => e.type === 'text').map(e => e.delta).join('')).toContain('Magnolia');
  });

  it('supports multi-round tool chains up to MAX_TOOL_ROUNDS', async () => {
    let fetchCount = 0;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      fetchCount++;
      if (fetchCount === 1) {
        return createSseResponse(['{"tool":"find_species","args":{"p_query":"magnolia"}}']);
      } else if (fetchCount === 2) {
        return createSseResponse(['{"tool":"find_observations","args":{"p_filters":{},"p_limit":5}}']);
      } else if (fetchCount === 3) {
        return createSseResponse(['{"tool":"find_projects","args":{"p_query":"conservation"}}']);
      }
      return createSseResponse(['Found all species, observations, and projects.']);
    });
    runToolMock.mockResolvedValue({ ok: true, data: [] });

    const events: Array<{ type: string; round?: number; delta?: string }> = [];
    for await (const chunk of streamChat({ messages: [{ role: 'user', content: 'find species chains' }] })) {
      events.push(chunk);
    }
    const toolCalls = events.filter(e => e.type === 'tool_call');
    expect(toolCalls.length).toBe(3);
    expect(toolCalls[0].round).toBe(0);
    expect(toolCalls[1].round).toBe(1);
    expect(toolCalls[2].round).toBe(2);
    expect(events.filter(e => e.type === 'text').map(e => e.delta).join('')).toContain('Found all');
  });

  it('tool_call and tool_result events include round index', async () => {
    let fetchCount = 0;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      fetchCount++;
      if (fetchCount === 1) {
        return createSseResponse(['{"tool":"find_species","args":{"p_query":"oak"}}']);
      }
      return createSseResponse(['Oak found.']);
    });
    runToolMock.mockResolvedValue({ ok: true, data: [] });

    const events: Array<{ type: string; round?: number }> = [];
    for await (const chunk of streamChat({ messages: [{ role: 'user', content: 'find oak' }] })) {
      events.push(chunk);
    }
    const toolCall = events.find(e => e.type === 'tool_call');
    const toolResult = events.find(e => e.type === 'tool_result');
    expect(toolCall?.round).toBe(0);
    expect(toolResult?.round).toBe(0);
  });

  it('circuit breaker stops repeated similar tool calls', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return createSseResponse(['{"tool":"find_species","args":{"p_query":"samequery"}}']);
    });
    runToolMock.mockResolvedValue({ ok: true, data: [] });

    const events: Array<{ type: string }> = [];
    for await (const chunk of streamChat({ messages: [{ role: 'user', content: 'loop' }] })) {
      events.push(chunk);
    }
    expect(events.filter(e => e.type === 'tool_call')).toHaveLength(1);
    expect(events.some(e => e.type === 'circuit_break')).toBe(true);
  });

  it('emits quota_exceeded when edge function returns 429 and no backup key exists', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('Rate limited', { status: 429 }));

    const events: Array<{ type: string }> = [];
    for await (const chunk of streamChat({ messages: [{ role: 'user', content: 'hello' }] })) {
      events.push(chunk);
    }
    expect(events.some(e => e.type === 'quota_exceeded')).toBe(true);
  });
});

describe('Gemini key rotation and failover', () => {
  const store = new Map<string, string>();
  beforeEach(() => {
    store.clear();
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => store.set(k, v),
        removeItem: (k: string) => store.delete(k),
        clear: () => store.clear(),
      },
      writable: true,
      configurable: true,
    });
  });

  it('manages primary and backup keys correctly', async () => {
    const {
      writeByoGeminiKey,
      writeByoGeminiBackupKey,
      readByoGeminiKey,
      readByoGeminiBackupKey,
      readAllGeminiKeys,
      rotateGeminiKeys,
      clearByoGeminiKeys,
    } = await import('./chat-engine');

    writeByoGeminiKey('key-primary-1');
    writeByoGeminiBackupKey('key-backup-2');

    expect(readByoGeminiKey()).toBe('key-primary-1');
    expect(readByoGeminiBackupKey()).toBe('key-backup-2');
    expect(readAllGeminiKeys()).toEqual(['key-primary-1', 'key-backup-2']);

    // Rotate keys: backup becomes primary, primary becomes backup
    const didRotate = rotateGeminiKeys();
    expect(didRotate).toBe(true);
    expect(readByoGeminiKey()).toBe('key-backup-2');
    expect(readByoGeminiBackupKey()).toBe('key-primary-1');

    clearByoGeminiKeys();
    expect(readByoGeminiKey()).toBeNull();
    expect(readByoGeminiBackupKey()).toBeNull();
    expect(readAllGeminiKeys()).toEqual([]);
  });

  it('streamChat auto-rotates to backup key when primary key returns 429', async () => {
    const {
      writeByoGeminiKey,
      writeByoGeminiBackupKey,
      readByoGeminiKey,
    } = await import('./chat-engine');

    writeByoGeminiKey('failing-key-1');
    writeByoGeminiBackupKey('working-key-2');

    let callCount = 0;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, opts) => {
      callCount++;
      const body = JSON.parse(opts?.body as string);
      if (body.client_gemini_key === 'failing-key-1') {
        return new Response('Rate limit', { status: 429 });
      }
      return createSseResponse(['Responded from backup key!']);
    });

    const out: string[] = [];
    for await (const chunk of streamChat({ messages: [{ role: 'user', content: 'test' }] })) {
      if (chunk.type === 'text') out.push(chunk.delta);
    }

    expect(out.join('')).toContain('Responded from backup key!');
    // Verified that it called twice (first failing, then working key)
    expect(callCount).toBe(2);
    // Verified that the working key is now the primary key
    expect(readByoGeminiKey()).toBe('working-key-2');
  });
});

