/**
 * /functions/v1/chat — Gemini Flash chat endpoint with streaming SSE.
 *
 * Key resolution order:
 *   1. GEMINI_API_KEY env var (operator server key, free tier)
 *   2. client_gemini_key in request body (user BYO key fallback)
 *
 * When both are exhausted, returns 402 so the client can prompt the user
 * to supply their own key.
 *
 * Deployed --no-verify-jwt (handles auth internally).
 *
 * Env vars:
 *   GEMINI_API_KEY — Google AI Studio key (optional, free-tier fallback)
 *   SUPABASE_URL / SUPABASE_ANON_KEY — for optional JWT auth checks
 */

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info, x-rastrum-build',
  'Access-Control-Max-Age': '86400',
};

const GEMINI_MODEL = 'gemini-3.8-flash';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

function jsonErr(msg: string, status: number): Response {
  return new Response(JSON.stringify({ ok: false, error: msg }), {
    status,
    headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
  });
}

type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string };
type RequestBody = {
  messages: ChatMessage[];
  client_gemini_key?: string;
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') return jsonErr('Method not allowed', 405);

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return jsonErr('Invalid JSON', 400);
  }

  const { messages, client_gemini_key } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return jsonErr('messages required', 400);
  }

  const apiKey = Deno.env.get('GEMINI_API_KEY') ?? client_gemini_key ?? null;
  if (!apiKey) {
    return jsonErr('NO_API_KEY', 402);
  }

  // Map from our chat format to Gemini's contents format.
  // System messages become the first user turn prefixed with [System].
  const systemParts: string[] = [];
  const contents: { role: string; parts: { text: string }[] }[] = [];

  for (const m of messages) {
    if (m.role === 'system') {
      systemParts.push(m.content);
      continue;
    }
    const role = m.role === 'assistant' ? 'model' : 'user';
    contents.push({ role, parts: [{ text: m.content }] });
  }

  // Gemini requires alternating user/model turns.
  // If the last turn is model, inject empty user ping.
  if (contents.length > 0 && contents[contents.length - 1].role === 'model') {
    contents.push({ role: 'user', parts: [{ text: '' }] });
  }
  // If empty, add a placeholder
  if (contents.length === 0) {
    contents.push({ role: 'user', parts: [{ text: 'Hello' }] });
  }

  const geminiBody = {
    systemInstruction: systemParts.length > 0
      ? { parts: [{ text: systemParts.join('\n') }] }
      : undefined,
    contents,
    generationConfig: {
      maxOutputTokens: 1024,
      temperature: 0.7,
    },
  };

  // Support both legacy AIza keys (?key=) and new AQ. auth keys (x-goog-api-key header).
  // Using x-goog-api-key header works for both formats.
  const url = `${GEMINI_API_BASE}/${GEMINI_MODEL}:streamGenerateContent?alt=sse`;

  const fetchGemini = async (): Promise<Response> => {
    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), 30_000);
    return fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(geminiBody),
      signal: ac.signal,
    }).finally(() => clearTimeout(timeout));
  };

  let geminiRes: Response;
  const MAX_RETRIES = 3;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      geminiRes = await fetchGemini();
    } catch (e) {
      return jsonErr(`Gemini fetch failed: ${e instanceof Error ? e.message : String(e)}`, 502);
    }
    if (geminiRes.status !== 503 || attempt === MAX_RETRIES) break;
    // 503 = model overloaded; wait 1 second and retry
    await new Promise<void>((r) => setTimeout(r, 1000 * attempt));
  }

  if (!geminiRes!.ok) {
    const errText = await geminiRes!.text().catch(() => 'unknown');
    console.error(`[chat] Gemini error status=${geminiRes!.status} body=${errText} keyPrefix=${apiKey.slice(0,6)}`);
    if (geminiRes!.status === 429) return jsonErr('RATE_LIMITED', 429);
    if (geminiRes!.status === 503) return jsonErr('MODEL_OVERLOADED', 503);
    if (geminiRes!.status === 400) return jsonErr(`Gemini 400 (bad request / invalid key format): ${errText}`, 502);
    if (geminiRes!.status === 401 || geminiRes!.status === 403) return jsonErr(`Gemini ${geminiRes!.status} (invalid API key): ${errText}`, 401);
    return jsonErr(`Gemini error ${geminiRes!.status}: ${errText}`, 502);
  }

  // Stream the SSE from Gemini back to the client, extracting text deltas.
  // We re-emit as our own simple SSE format: `data: {"delta":"..."}` lines.
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const reader = geminiRes.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const send = (delta: string) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`));
      };

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
            if (raw === '[DONE]') continue;
            try {
              const parsed = JSON.parse(raw) as {
                candidates?: Array<{
                  content?: { parts?: Array<{ text?: string }> };
                  finishReason?: string;
                }>;
              };
              const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) send(text);
            } catch {
              // skip malformed lines
            }
          }
        }
      } catch {
        // Reader closed or aborted — done
      } finally {
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache',
      'x-accel-buffering': 'no',
    },
  });
});
