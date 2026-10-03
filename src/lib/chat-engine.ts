/**
 * Chat dispatch: Gemini 2.0 Flash via the `chat` Edge Function.
 * Falls back to a user-supplied BYO key when the server quota is exhausted.
 *
 * Emits typed StreamEvents consumed by ChatView.astro.
 */
import { runTool, toolDefinitions, buildUpdateNotesAction } from './chat-tools';
import type { ChatAction } from './chat-tools';
import { getSupabase, getSupabaseUrl, getSupabaseAnonKey } from './supabase';

export type ChatMessage = { role: 'system' | 'user' | 'assistant' | 'tool'; content: string };

export type StreamEvent =
  | { type: 'text'; delta: string }
  | { type: 'tool_call'; tool: string; args: unknown; round: number }
  | { type: 'tool_result'; tool: string; result: unknown; round: number }
  | { type: 'engine_fallback'; engine: 'llama'; reason: string }
  | { type: 'circuit_break'; reason: string }
  | { type: 'action_suggestion'; action: ChatAction }
  | { type: 'quota_exceeded' }
  | { type: 'error'; message: string };

export interface StreamChatInput {
  messages: ChatMessage[];
  /** Optional BYO Gemini API key from localStorage. */
  geminiKey?: string;
  /** @deprecated kept for callers that still pass this — ignored. */
  prefer?: 'gemma' | 'llama';
}

const TOOL_RE = /^\s*\{\s*"tool"\s*:/;
const ACTION_SUGGEST_RE = /^\s*\{\s*"suggest_action"\s*:/;
const MAX_TOOL_ROUNDS = 3;
const TOKEN_BUDGET_CHARS = 4000;
const SYSTEM_TOOLS_PROMPT = `You may emit a JSON tool call to look up data. Tools available:\n%TOOLS%\nWhen calling a tool, respond with ONLY a JSON object: {"tool": "<name>", "args": { ... }}. Otherwise reply in prose. Use tools sparingly.`;

export const BYO_GEMINI_KEY = 'rastrum.byoKeys.gemini';

export function readByoGeminiKey(): string | null {
  try {
    return localStorage.getItem(BYO_GEMINI_KEY) || null;
  } catch {
    return null;
  }
}

export function writeByoGeminiKey(key: string): void {
  try { localStorage.setItem(BYO_GEMINI_KEY, key); } catch { /* ignore */ }
}

export function clearByoGeminiKey(): void {
  try { localStorage.removeItem(BYO_GEMINI_KEY); } catch { /* ignore */ }
}

function withToolPrompt(messages: ChatMessage[]): ChatMessage[] {
  const sys = SYSTEM_TOOLS_PROMPT.replace('%TOOLS%', toolDefinitions());
  return [{ role: 'system', content: sys }, ...messages];
}

/** Levenshtein distance between two strings (capped at maxDist for speed). */
function levenshtein(a: string, b: string, maxDist = 100): number {
  if (a === b) return 0;
  if (a.length === 0) return Math.min(b.length, maxDist);
  if (b.length === 0) return Math.min(a.length, maxDist);
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = i;
    for (let j = 1; j <= b.length; j++) {
      const val = a[i - 1] === b[j - 1] ? row[j - 1] : Math.min(row[j - 1], row[j], prev) + 1;
      row[j - 1] = prev;
      prev = val;
    }
    row[b.length] = prev;
  }
  return row[b.length];
}

async function* streamGeminiEdge(
  messages: ChatMessage[],
  geminiKey?: string,
): AsyncIterable<StreamEvent> {
  const supabase = getSupabase();
  const body: Record<string, unknown> = { messages };
  if (geminiKey) body['client_gemini_key'] = geminiKey;

  const { data: { session } } = await supabase.auth.getSession();
  const anonKey = getSupabaseAnonKey();
  const token = session?.access_token || anonKey;
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'Accept': 'text/event-stream',
  };
  if (anonKey) headers['apikey'] = anonKey;
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const url = `${getSupabaseUrl()}/functions/v1/chat`;

  let response: Response;
  try {
    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), 35_000);
    response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: ac.signal,
    }).finally(() => clearTimeout(timeout));
  } catch (e) {
    yield { type: 'error', message: e instanceof Error ? e.message : String(e) };
    return;
  }

  if (response.status === 429 || response.status === 402) {
    yield { type: 'quota_exceeded' };
    return;
  }
  if (response.status === 503) {
    yield { type: 'error', message: 'El modelo está sobrecargado en este momento. Intentá de nuevo en unos segundos.' };
    return;
  }
  if (!response.ok) {
    const text = await response.text().catch(() => `HTTP ${response.status}`);
    yield { type: 'error', message: text };
    return;
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (raw === '[DONE]') return;
        try {
          const parsed = JSON.parse(raw) as { delta?: string; error?: string };
          if (parsed.delta) yield { type: 'text', delta: parsed.delta };
          if (parsed.error === 'RATE_LIMITED') {
            yield { type: 'quota_exceeded' };
            return;
          }
        } catch {
          // skip malformed lines
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Streaming chat with a multi-round tool-call loop. Yields:
 *   { type: 'text', delta }            — model text deltas
 *   { type: 'tool_call', tool, args }  — when the model emitted a tool
 *   { type: 'tool_result', tool, … }   — after tool dispatch
 *   { type: 'quota_exceeded' }         — server quota hit, prompt BYO key
 *   { type: 'error', message }         — terminal error
 */
export async function* streamChat(input: StreamChatInput): AsyncIterable<StreamEvent> {
  const messages = withToolPrompt(input.messages);
  const geminiKey = input.geminiKey ?? readByoGeminiKey() ?? undefined;
  let toolRounds = 0;
  let accumulatedTextChars = 0;
  const calledTools: Array<{ tool: string; argsStr: string }> = [];

  while (true) {
    let accumulated = '';
    let toolCallText: string | null = null;
    const buffered: StreamEvent[] = [];

    for await (const ev of streamGeminiEdge(messages, geminiKey)) {
      if (ev.type === 'quota_exceeded') {
        yield ev;
        return;
      }
      if (ev.type === 'error') {
        yield ev;
        return;
      }
      if (ev.type === 'text') {
        accumulated += ev.delta;
        if (toolCallText === null && accumulated.length >= 16 && !TOOL_RE.test(accumulated) && !ACTION_SUGGEST_RE.test(accumulated)) {
          for (const b of buffered) yield b;
          buffered.length = 0;
          yield ev;
          accumulatedTextChars += ev.delta.length;
        } else if (toolCallText === null) {
          buffered.push(ev);
        }
        if (TOOL_RE.test(accumulated)) toolCallText = accumulated;
        if (ACTION_SUGGEST_RE.test(accumulated)) toolCallText = accumulated;
      } else {
        for (const b of buffered) yield b;
        buffered.length = 0;
        yield ev;
      }
    }

    if (accumulatedTextChars >= TOKEN_BUDGET_CHARS) {
      for (const b of buffered) yield b;
      return;
    }

    if (toolCallText && toolRounds < MAX_TOOL_ROUNDS) {
      let parsed: { tool?: string; args?: unknown; suggest_action?: string; observation_id?: string; notes?: string } | null = null;
      try { parsed = JSON.parse(toolCallText.trim()); } catch { /* fallthrough */ }
      if (!parsed) {
        for (const b of buffered) yield b;
        return;
      }

      if (parsed.suggest_action === 'update_notes' && parsed.observation_id && parsed.notes) {
        const action = buildUpdateNotesAction(parsed.observation_id, parsed.notes);
        yield { type: 'action_suggestion', action };
        for (const b of buffered) yield b;
        return;
      }

      if (!parsed.tool) {
        for (const b of buffered) yield b;
        return;
      }

      const argsStr = JSON.stringify(parsed.args ?? {});
      const isDuplicate = calledTools.some(prev => {
        if (prev.tool !== parsed!.tool) return false;
        const maxLen = Math.max(prev.argsStr.length, argsStr.length);
        if (maxLen === 0) return true;
        const dist = levenshtein(prev.argsStr, argsStr, Math.ceil(maxLen * 0.1) + 1);
        return dist < maxLen * 0.1;
      });

      if (isDuplicate) {
        yield { type: 'circuit_break', reason: `Tool '${parsed.tool}' called with similar args in same turn` };
        for (const b of buffered) yield b;
        return;
      }

      calledTools.push({ tool: parsed.tool, argsStr });
      yield { type: 'tool_call', tool: parsed.tool, args: parsed.args ?? {}, round: toolRounds };
      const result = await runTool({ name: parsed.tool, args: parsed.args ?? {} });
      yield { type: 'tool_result', tool: parsed.tool, result, round: toolRounds };
      toolRounds++;
      messages.push({ role: 'assistant', content: toolCallText });
      messages.push({ role: 'tool', content: JSON.stringify(result) });
      continue;
    }

    for (const b of buffered) yield b;
    return;
  }
}
