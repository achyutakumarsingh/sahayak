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
export async function* streamAgent({
  module,
  messages,
  language,
  signal,
}: {
  module: string;
  messages: Pick<ChatMessage, "role" | "content">[];
  language: string;
  signal?: AbortSignal;
}): AsyncGenerator<AgentEvent> {
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
        yield JSON.parse(line.slice(6)) as AgentEvent;
      } catch {
        /* a malformed frame should not kill the whole stream */
      }
    }
  }
}
