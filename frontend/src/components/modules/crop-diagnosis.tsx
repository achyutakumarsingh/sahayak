"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Reveal } from "@/components/reveal";
import { Button, Card, Disclaimer, StatusDot } from "@/components/ui";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { apiUrl } from "@/lib/api";
import { cn } from "@/lib/cn";

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

type Prediction = { label: string; confidence: number };
type Advice = { summary: string; next_step: string; caution: string };
type Result = {
  status: "ok" | "unclear";
  reason: "low_confidence" | "ambiguous" | null;
  predictions: Prediction[];
  topConfidence: number;
  margin: number;
  model: string;
  inputSize: number[];
  advice: Advice | null;
  adviceAvailable: boolean;
};

type FlagState = "idle" | "sending" | "done" | "error";

/** Turns "Tomato___Early_blight" into "Tomato · Early blight". */
function prettyLabel(label: string): string {
  return label
    .split("___")
    .map((part) => part.replace(/_/g, " ").trim())
    .filter(Boolean)
    .join(" · ");
}

export function CropDiagnosis({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const t = dict.farmer;

  const inputRef = useRef<HTMLInputElement>(null);
  const [modelReady, setModelReady] = useState<boolean | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [payload, setPayload] = useState<{ base64: string; mediaType: string } | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flag, setFlag] = useState<FlagState>("idle");
  const [autoRun, setAutoRun] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(apiUrl("/api/farmers/model-status"), { signal: controller.signal })
      .then((r) => r.json())
      .then((body: { available: boolean }) => setModelReady(Boolean(body.available)))
      .catch(() => setModelReady(false));
    return () => controller.abort();
  }, []);

  const onPick = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      setResult(null);
      setError(null);

      if (!ALLOWED.includes(file.type)) return setError(t.errorType);
      if (file.size > MAX_BYTES) return setError(t.errorSize);

      const reader = new FileReader();
      reader.onload = () => {
        const value = String(reader.result);
        setPreview(value);
        setPayload({ base64: value.split(",")[1] ?? "", mediaType: file.type });
      };
      reader.readAsDataURL(file);
    },
    [t],
  );

  // Demo Mode: fetch the bundled sample leaf and feed it through the ordinary
  // path. Nothing is faked — the classifier really runs on it.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("demo") !== "diagnose") return;
    let cancelled = false;

    (async () => {
      try {
        const blob = await (await fetch("/demo/sample-leaf.png")).blob();
        const dataUrl: string = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        if (cancelled) return;
        setPreview(dataUrl);
        setPayload({ base64: dataUrl.split(",")[1] ?? "", mediaType: "image/png" });
        setAutoRun(true);
      } catch {
        /* demo aid only — a failure here must not disturb the real screen */
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!autoRun || !payload) return;
    // Deferred out of the effect body. setTimeout rather than rAF: a browser
    // pauses rAF entirely in a background tab, which would silently leave the
    // demo trigger unfired.
    const timer = window.setTimeout(() => {
      setAutoRun(false);
      void run();
    }, 0);
    return () => window.clearTimeout(timer);
    // run() is stable enough for this one-shot demo trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun, payload]);

  async function run() {
    if (!payload) return;
    setBusy(true);
    setError(null);
    setResult(null);
    setFlag("idle");

    try {
      const response = await fetch(apiUrl("/api/farmers/diagnose"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_base64: payload.base64,
          media_type: payload.mediaType,
          language: locale,
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { detail?: string };
        setError(response.status === 503 ? t.modelMissingBody : body.detail ?? t.errorGeneric);
        return;
      }
      setResult((await response.json()) as Result);
    } catch {
      setError(t.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  async function reportWrong() {
    if (!payload || !result || result.status !== "ok") return;
    setFlag("sending");
    try {
      const response = await fetch(apiUrl("/api/farmers/flag"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          predicted_label: result.predictions[0].label,
          confidence: result.predictions[0].confidence,
          image_base64: payload.base64,
          media_type: payload.mediaType,
        }),
      });
      setFlag(response.ok ? "done" : "error");
    } catch {
      setFlag("error");
    }
  }

  return (
    <section aria-labelledby="diagnose-heading" className="flex flex-col gap-4">
      <div>
        <h2 id="diagnose-heading" className="text-lg font-semibold tracking-tight text-ink">
          {t.diagnoseTitle}
        </h2>
        <p className="mt-1 text-ink-2">{t.diagnoseIntro}</p>
      </div>

      {/* Stated up front, not after the farmer has waited for a result. */}
      {modelReady === false ? (
        <Disclaimer tone="sample" label={t.modelMissingLabel}>
          {t.modelMissingBody}
        </Disclaimer>
      ) : null}

      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={inputRef}
            id="leaf-photo"
            type="file"
            accept={ALLOWED.join(",")}
            className="sr-only"
            onChange={(e) => onPick(e.target.files?.[0])}
          />
          <Button
            type="button"
            variant={preview ? "text" : "primary"}
            withArrow={!preview}
            onClick={() => inputRef.current?.click()}
          >
            {preview ? t.changePhoto : t.choosePhoto}
          </Button>
          {preview ? (
            <Button
              type="button"
              variant="primary"
              withArrow
              onClick={() => void run()}
              disabled={busy || modelReady === false}
            >
              {busy ? t.diagnosing : t.diagnose}
            </Button>
          ) : null}
        </div>

        {preview ? (
          <div className="flex flex-col gap-1.5">
            <span className="label">{t.preview}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt={t.preview}
              className="max-h-56 w-auto rounded-card border border-border object-contain"
            />
          </div>
        ) : null}

        <p role="alert" aria-live="polite" className="min-h-5 text-xs text-danger">
          {error}
        </p>
      </Card>

      <div aria-live="polite" aria-busy={busy}>
        {result && result.status === "unclear" ? (
          <Reveal>
          <Card className="border-warn/50">
            <p className="label text-warn">{t.unclearTitle}</p>
            <p className="mt-2 text-ink">
              {result.reason === "ambiguous" ? t.unclearAmbiguous : t.unclearLowConfidence}
            </p>
            <p className="mt-2 text-ink-2">{t.unclearHelp}</p>
            <p className="meta mt-3 text-subtle">
              {t.unclearDetail
                .replace("{top}", `${(result.topConfidence * 100).toFixed(1)} %`)
                .replace("{margin}", `${(result.margin * 100).toFixed(1)} pt`)}
            </p>
          </Card>
          </Reveal>
        ) : result ? (
          <div className="flex flex-col gap-4">
            <Card>
              <div className="flex items-baseline justify-between gap-3">
                <p className="label">{t.results}</p>
                <p className="meta text-subtle">
                  {result.model} · {result.inputSize.join("×")}
                </p>
              </div>
              <div className="mt-4">
                <p className="display-sm text-2xl text-ink">
                  {prettyLabel(result.predictions[0].label)}
                </p>

                <div className="mt-3 flex items-center gap-4">
                  <div
                    className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-[2px] bg-surface-2"
                    role="img"
                    aria-label={`${t.confidence}: ${(result.predictions[0].confidence * 100).toFixed(1)}%`}
                  >
                    <div
                      className="accent-bar"
                      style={{ width: `${Math.round(result.predictions[0].confidence * 100)}%` }}
                    />
                  </div>
                  <span className="meta shrink-0 text-2xl text-ink tabular-nums">
                    {(result.predictions[0].confidence * 100).toFixed(1)} %
                  </span>
                </div>
              </div>

              {/* Runner-up classes stay monochrome — the bar is the only accent. */}
              <ul className="mt-5 border-t border-border pt-1">
                {result.predictions.slice(1).map((p) => (
                  <li
                    key={p.label}
                    className="flex items-baseline justify-between gap-4 border-b border-border py-2 last:border-b-0"
                  >
                    <span className="text-ink-2">{prettyLabel(p.label)}</span>
                    <span className="meta text-ink-2">{(p.confidence * 100).toFixed(1)} %</span>
                  </li>
                ))}
              </ul>

              {/* Feedback loop: a wrong call is only useful if a farmer can say so. */}
              <div className="mt-4 border-t border-border pt-3">
                {flag === "done" ? (
                  <p role="status" className="text-ok">
                    {t.flagThanks}{" "}
                    <span className="text-ink-2">{t.flagStored}</span>
                  </p>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Monochrome: the confidence bar is this screen's accent. */}
                    <Button
                      type="button"
                      size="sm"
                      withArrow={false}
                      onClick={() => void reportWrong()}
                      disabled={flag === "sending"}
                      className="text-ink-2 hover:text-ink"
                    >
                      {flag === "sending" ? t.flagSending : t.flagPrompt}
                    </Button>
                    {flag === "error" ? (
                      <span role="alert" className="text-xs text-danger">
                        {t.flagError}
                      </span>
                    ) : null}
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <p className="label">{t.adviceTitle}</p>
              {result.advice ? (
                <div className="mt-3 flex flex-col gap-2">
                  <p className="text-ink">{result.advice.summary}</p>
                  <p className="text-ink-2">{result.advice.next_step}</p>
                  <StatusDot tone="warn" label={result.advice.caution} />
                </div>
              ) : (
                <p className="mt-3 text-ink-2">{t.noAdvice}</p>
              )}
            </Card>
          </div>
        ) : busy ? null : (
          <p className="text-ink-2">{t.empty}</p>
        )}
      </div>

      <Disclaimer label={t.disclaimerLabel}>{t.disclaimerBody}</Disclaimer>
    </section>
  );
}
