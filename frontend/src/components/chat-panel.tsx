"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";

import { Button, Card, Disclaimer } from "@/components/ui";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { streamAgent, type ChatMessage } from "@/lib/agent-stream";
import { cn } from "@/lib/cn";

let counter = 0;
const nextId = () => `m${++counter}`;

export type ChatPanelProps = {
  /** Module slug — must match a file in backend/grounding/. */
  module: string;
  locale: Locale;
  dict: Dictionary;
  /** Replaces the default grounding disclaimer. Pass null to omit it. */
  disclaimer?: ReactNode | null;
  /** Starter questions; falls back to dict.chat.suggestions[module]. */
  suggestions?: string[];
  className?: string;
};

/**
 * The shared chat surface for every grounded module. A module page drops this
 * in with its slug; the system prompt, grounding corpus and refusal behaviour
 * all live on the backend.
 */
export function ChatPanel({
  module,
  locale,
  dict,
  disclaimer,
  suggestions,
  className,
}: ChatPanelProps) {
  const t = dict.chat;
  const starters =
    suggestions ??
    (t.suggestions as Record<string, string[] | undefined>)[module] ??
    [];

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  const send = useCallback(
    async (question: string) => {
      const text = question.trim();
      if (!text || streaming) return;

      setError(null);
      setDraft("");

      const outgoing: ChatMessage = { id: nextId(), role: "user", content: text };
      const replyId = nextId();

      // The history sent upstream is what the reader can see, and excludes the
      // empty assistant placeholder we render for the streaming text.
      const history = [...messages, outgoing].map(({ role, content }) => ({
        role,
        content,
      }));

      setMessages((prev) => [
        ...prev,
        outgoing,
        { id: replyId, role: "assistant", content: "" },
      ]);
      setStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        for await (const event of streamAgent({
          module,
          messages: history,
          language: locale,
          signal: controller.signal,
        })) {
          if (event.type === "delta") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === replyId ? { ...m, content: m.content + event.text } : m,
              ),
            );
          } else if (event.type === "error") {
            setError(
              event.code === "not_configured"
                ? t.errorNotConfigured
                : event.message || t.errorGeneric,
            );
          }
        }
      } catch (cause) {
        if ((cause as Error)?.name !== "AbortError") {
          setError(t.errorOffline);
        }
      } finally {
        setStreaming(false);
        abortRef.current = null;
        // Drop the placeholder if nothing ever arrived, so the log does not
        // show an empty reply bubble next to the error.
        setMessages((prev) =>
          prev.filter((m) => !(m.id === replyId && m.content === "")),
        );
      }
    },
    [messages, module, locale, streaming, t],
  );

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void send(draft);
  }

  return (
    <section aria-labelledby="chat-heading" className={cn("flex flex-col gap-4", className)}>
      <div>
        <h2 id="chat-heading" className="text-lg font-semibold tracking-tight text-ink">
          {t.title}
        </h2>
        <p className="mt-1 text-ink-2">{t.intro}</p>
      </div>

      {disclaimer === undefined ? (
        <Disclaimer label={t.disclaimerLabel}>{t.disclaimerBody}</Disclaimer>
      ) : (
        disclaimer
      )}

      <Card padding="none" className="flex flex-col">
        <div
          role="log"
          aria-label={t.log}
          aria-live="polite"
          aria-busy={streaming}
          className="flex max-h-[26rem] min-h-40 flex-col gap-4 overflow-y-auto pad-md"
        >
          {messages.length === 0 ? (
            <p className="text-ink-2">{t.empty}</p>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="flex flex-col gap-1">
                <span className="label">
                  {message.role === "user" ? t.you : t.assistant}
                </span>
                <p
                  className={cn(
                    "whitespace-pre-wrap",
                    message.role === "user" ? "text-ink" : "text-ink-2",
                  )}
                >
                  {message.content}
                  {streaming && message.content === "" ? (
                    <span className="meta">{t.thinking}</span>
                  ) : null}
                </p>
              </div>
            ))
          )}
          <div ref={logEndRef} />
        </div>

        {starters.length > 0 && messages.length === 0 ? (
          <div className="border-t border-border pad-md">
            <p className="label">{t.suggestionsLabel}</p>
            <ul className="mt-2 flex flex-col gap-1.5">
              {starters.map((starter) => (
                <li key={starter}>
                  <Button
                    size="sm"
                    onClick={() => void send(starter)}
                    disabled={streaming}
                    className="text-left"
                  >
                    {starter}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="flex flex-col gap-3 border-t border-border pad-md">
          <label htmlFor="chat-input" className="sr-only">
            {t.inputLabel}
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <input
              id="chat-input"
              name="question"
              type="text"
              autoComplete="off"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={t.placeholder}
              disabled={streaming}
              className={cn(
                "min-w-0 flex-1 rounded-chip border border-border bg-surface px-3 py-2 text-ink",
                "placeholder:text-subtle disabled:opacity-60",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
              )}
            />
            {streaming ? (
              <Button
                type="button"
                variant="primary"
                withArrow={false}
                onClick={() => abortRef.current?.abort()}
              >
                {t.stop}
              </Button>
            ) : (
              <Button type="submit" variant="primary" withArrow disabled={!draft.trim()}>
                {t.send}
              </Button>
            )}
            {messages.length > 0 && !streaming ? (
              <Button
                type="button"
                size="sm"
                withArrow={false}
                onClick={() => {
                  setMessages([]);
                  setError(null);
                }}
              >
                {t.clear}
              </Button>
            ) : null}
          </div>

          <p role="alert" aria-live="assertive" className="min-h-5 text-xs text-danger">
            {error}
          </p>
        </form>
      </Card>
    </section>
  );
}
