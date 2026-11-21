// Single client for NVIDIA NIM chat completions. All model ids live here, so when NVIDIA
// retires a model (they return HTTP 410) only this file changes. Server-only.

const NIM_CHAT_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

/** Current NIM models (verified against GET /v1/models, 2026-11). Tried in order. */
export const NIM_MODELS = {
  fast: "nvidia/nemotron-3.5-lightning-30b-a3b",
  strong: "nvidia/nemotron-3-ultra-550b-a55b",
} as const;

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface NimChatOptions {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  /**
   * Nemotron models reason before answering. Thinking off = ~1 s answers (tutoring, feedback);
   * thinking on = slower but more careful (e.g. writing questions with verified answers).
   * Reasoning tokens count towards maxTokens, so raise it when thinking is on.
   */
  thinking?: boolean;
  timeoutMs?: number;
  models?: string[];
}

export function isNimConfigured(): boolean {
  return Boolean(process.env.NVIDIA_API_KEY);
}

/** Returns the first model's answer text, or null if every model failed (callers fall back). */
export async function nimChat(opts: NimChatOptions): Promise<{ content: string; model: string } | null> {
  const key = process.env.NVIDIA_API_KEY;
  if (!key) return null;

  const models = opts.models ?? [NIM_MODELS.fast, NIM_MODELS.strong];
  for (const model of models) {
    try {
      const res = await fetch(NIM_CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model,
          messages: opts.messages,
          temperature: opts.temperature ?? 0.4,
          max_tokens: opts.maxTokens ?? (opts.thinking ? 4000 : 900),
          chat_template_kwargs: { enable_thinking: Boolean(opts.thinking) },
        }),
        signal: AbortSignal.timeout(opts.timeoutMs ?? (opts.thinking ? 45_000 : 15_000)),
      });
      if (!res.ok) {
        console.warn(`[NIM] ${model} HTTP ${res.status}`);
        continue;
      }
      const data = await res.json();
      const content: string = data?.choices?.[0]?.message?.content?.trim() ?? "";
      if (content) return { content, model };
      console.warn(`[NIM] ${model} returned an empty answer`);
    } catch (err) {
      console.warn(`[NIM] ${model} failed:`, (err as Error)?.message);
    }
  }
  return null;
}
