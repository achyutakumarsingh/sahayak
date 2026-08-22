"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
  predictions: Prediction[];
  model: string;
  inputSize: number[];
  advice: Advice | null;
  adviceAvailable: boolean;
};

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

  async function run() {
    if (!payload) return;
    setBusy(true);
    setError(null);
    setResult(null);

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
        {result ? (
          <div className="flex flex-col gap-4">
            <Card>
              <div className="flex items-baseline justify-between gap-3">
                <p className="label">{t.results}</p>
                <p className="meta text-subtle">
                  {result.model} · {result.inputSize.join("×")}
                </p>
              </div>
              <ul className="mt-3">
                {result.predictions.map((p, i) => (
                  <li
                    key={p.label}
                    className="flex items-baseline justify-between gap-4 border-b border-border py-2 last:border-b-0"
                  >
                    <span className={cn(i === 0 ? "font-medium text-ink" : "text-ink-2")}>
                      {prettyLabel(p.label)}
                    </span>
                    <span className="meta text-ink">{(p.confidence * 100).toFixed(1)} %</span>
                  </li>
                ))}
              </ul>
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
