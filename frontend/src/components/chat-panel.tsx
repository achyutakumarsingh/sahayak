"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";

import { Button, Card, Disclaimer } from "@/components/ui";
import { MicIcon, SpeakerIcon } from "@/components/ui/icons";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { streamAgent, type ChatMessage } from "@/lib/agent-stream";
import { cn } from "@/lib/cn";

/** Minimal shape of the Web Speech API we rely on; it is not in lib.dom. */
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  start: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: SpeechRecognitionResultLike) => void) | null;
};

type SpeechRecognitionResultLike = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

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
  const [listening, setListening] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  // Text-To-Speech Playback
  const speakMessage = useCallback((id: string, text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    if (speakingId === id) {
      setSpeakingId(null);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = locale === "hi" ? "hi-IN" : "en-IN";
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  }, [locale, speakingId]);

  // Voice Input Speech Recognition
  const toggleListening = useCallback(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike })
        .webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    if (listening) {
      setListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = locale === "hi" ? "hi-IN" : "en-IN";
      recognition.interimResults = false;

      recognition.onstart = () => setListening(true);
      recognition.onend = () => setListening(false);
      recognition.onerror = () => {
        setListening(false);
        setError("Voice input error. Please try typing.");
      };
      recognition.onresult = (event: SpeechRecognitionResultLike) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) setDraft(transcript);
      };

      recognition.start();
    } catch {
      setListening(false);
    }
  }, [listening, locale]);

  const send = useCallback(
    async (question: string) => {
      const text = question.trim();
      if (!text || streaming) return;

      setError(null);
      setDraft("");

      const outgoing: ChatMessage = { id: nextId(), role: "user", content: text };
      const replyId = nextId();

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
          className="flex max-h-[28rem] min-h-40 flex-col gap-4 overflow-y-auto pad-md"
        >
          {messages.length === 0 ? (
            <p className="text-ink-2">{t.empty}</p>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="flex flex-col gap-1 group">
                <div className="flex items-center justify-between gap-2">
                  <span className="label">
                    {message.role === "user" ? t.you : t.assistant}
                  </span>
                  {message.role === "assistant" && message.content ? (
                    <button
                      type="button"
                      onClick={() => speakMessage(message.id, message.content)}
                      className={cn(
                        "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-chip border transition-colors",
                        speakingId === message.id
                          ? "bg-accent text-accent-ink border-accent"
                          : "border-border text-ink-2 hover:text-ink hover:bg-surface-2",
                      )}
                      aria-label={speakingId === message.id ? (t.stopAudio || "Stop") : (t.listen || "Listen")}
                    >
                      <SpeakerIcon />
                      <span>{speakingId === message.id ? (t.stopAudio || "Stop") : (t.listen || "Listen")}</span>
                    </button>
                  ) : null}
                </div>
                <p
                  className={cn(
                    "whitespace-pre-wrap",
                    message.role === "user" ? "text-ink" : "text-ink-2",
                  )}
                >
                  {message.content}
                  {streaming && message.content === "" ? (
                    <span className="flex flex-col gap-2 py-2">
                      <span className="h-3 w-48 rounded bg-border animate-pulse inline-block" />
                      <span className="h-3 w-36 rounded bg-border animate-pulse inline-block" />
                    </span>
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
              placeholder={listening ? (t.micListening || "Listening...") : t.placeholder}
              disabled={streaming}
              className={cn(
                "min-w-0 flex-1 rounded-chip border border-border bg-surface px-3 py-2 text-ink",
                "placeholder:text-subtle disabled:opacity-60",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                listening && "border-accent ring-1 ring-accent",
              )}
            />

            <button
              type="button"
              onClick={toggleListening}
              disabled={streaming}
              className={cn(
                "inline-flex items-center gap-1 px-3 py-2 rounded-chip border text-sm font-medium transition-colors",
                listening
                  ? "bg-danger text-white border-danger animate-pulse"
                  : "border-border bg-surface text-ink hover:bg-surface-2",
              )}
              title={t.micStart || "Speak"}
            >
              <MicIcon />
              <span className="sr-only sm:not-sr-only sm:text-xs">
                {listening ? (t.micListening || "Listening...") : (t.micStart || "Voice")}
              </span>
            </button>

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
