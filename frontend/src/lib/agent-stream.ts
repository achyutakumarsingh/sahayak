import { apiUrl } from "@/lib/api";

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

export type AgentEvent =
  | { type: "delta"; text: string }
  | { type: "done"; stopReason?: string; model?: string; outputTokens?: number }
  | { type: "error"; code: string; message: string };

/**
 * Streams POST /api/agent/{module} and yields each server-sent event.
 *
 * The backend speaks plain SSE data frames, so this reads the body directly
 * rather than using EventSource — EventSource cannot issue a POST.
 */
/* --------------------------------------------------------------------------
   Answer cache for the offline demo.

   sessionStorage rather than an in-memory Map so a cached answer survives a
   reload during a demo. Keyed on module + language + the exact question, so
   switching language does not serve an answer in the wrong one.
   -------------------------------------------------------------------------- */

const CACHE_KEY = "sahayak.answerCache";

function cacheId(module: string, language: string, question: string): string {
  return `${module}|${language}|${question.trim().toLowerCase()}`;
}

function readCache(): Record<string, string> {
  try {
    return JSON.parse(window.sessionStorage.getItem(CACHE_KEY) ?? "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

export function cacheAnswer(module: string, language: string, question: string, answer: string) {
  try {
    const all = readCache();
    all[cacheId(module, language, question)] = answer;
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(all));
  } catch {
    /* private mode — offline replay just will not have anything to serve */
  }
}

export function cachedAnswer(module: string, language: string, question: string): string | null {
  try {
    return readCache()[cacheId(module, language, question)] ?? null;
  } catch {
    return null;
  }
}

export async function* streamAgent({
  module,
  messages,
  language,
  signal,
  offline = false,
}: {
  module: string;
  messages: Pick<ChatMessage, "role" | "content">[];
  language: string;
  signal?: AbortSignal;
  /** Simulated offline: never touch the network, replay from cache only. */
  offline?: boolean;
}): AsyncGenerator<AgentEvent> {
  const question = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

  if (offline) {
    const hit = cachedAnswer(module, language, question);
    if (hit === null) {
      yield { type: "error", code: "offline_miss", message: "" };
      return;
    }
    // Replayed in one chunk: it is already known, so pretending to type it out
    // would be slower than being online, which is the wrong impression.
    yield { type: "delta", text: hit };
    yield { type: "done", stopReason: "cache" };
    return;
  }

  const response = await fetch(apiUrl(`/api/agent/${module}`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, language }),
    signal,
  });

  if (!response.ok || !response.body) {
    // FastAPI reports refusals (404 unknown module, 503 no API key) as JSON
    // before the stream opens, so surface that detail rather than a generic
    // failure the reader cannot act on.
    let message = `HTTP ${response.status}`;
    const code = response.status === 503 ? "not_configured" : "request";
    try {
      const body = (await response.json()) as { detail?: string };
      if (body.detail) message = body.detail;
    } catch {
      /* not JSON — keep the status line */
    }
    yield { type: "error", code, message };
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let answer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Events are separated by a blank line; a partial tail stays buffered.
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";

    for (const frame of frames) {
      const line = frame.split("\n").find((l) => l.startsWith("data: "));
      if (!line) continue;
      try {
        const event = JSON.parse(line.slice(6)) as AgentEvent;
        if (event.type === "delta") answer += event.text;
        if (event.type === "done" && answer) {
          cacheAnswer(module, language, question, answer);
        }
        yield event;
      } catch {
        /* a malformed frame should not kill the whole stream */
      }
    }
  }
}


/**
 * Splits the trailing "SOURCE: <ids>" line the grounded prompt asks for off the
 * end of an answer.
 *
 * The model is instructed to emit it, but a model can always ignore an
 * instruction — so a missing line yields `null` and the caller falls back to
 * naming the dataset rather than showing nothing.
 */
export function splitSource(text: string): { body: string; source: string | null } {
  const match = text.match(/\n?\s*SOURCE:\s*(.+?)\s*$/i);
  if (!match) return { body: text, source: null };

  const raw = match[1].trim();
  const body = text.slice(0, match.index).trimEnd();
  if (!raw || raw.toLowerCase() === "none") return { body, source: null };
  return { body, source: raw };
}
