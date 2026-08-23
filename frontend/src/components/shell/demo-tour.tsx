"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import {
  demoSteps,
  readStep,
  STEP_MS,
  writeStep,
} from "@/lib/demo-tour";

/**
 * Drives the scripted walkthrough and shows the caption bar. Mounted in the
 * shell so it survives the navigations between steps.
 *
 * Advances on a timer OR on any key — a judge should never be stuck waiting,
 * and a timer alone is fragile if a page is slow to settle.
 */
export function DemoTour({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const router = useRouter();
  const params = useSearchParams();
  const [step, setStep] = useState<number | null>(null);

  const steps = demoSteps(locale);

  // Re-read the pointer whenever the URL changes, so the bar keeps its place
  // across the navigations the tour itself performs.
  useEffect(() => {
    // Deferred out of the effect body; setTimeout survives a background tab
    // where rAF is paused.
    const timer = window.setTimeout(() => setStep(readStep()), 0);
    return () => window.clearTimeout(timer);
  }, [params]);

  const stop = useCallback(() => {
    writeStep(null);
    setStep(null);
  }, []);

  const advance = useCallback(() => {
    const current = readStep();
    if (current === null) return;
    const next = current + 1;
    if (next >= steps.length) {
      stop();
      return;
    }
    writeStep(next);
    setStep(next);
    router.push(steps[next].href);
  }, [router, steps, stop]);

  useEffect(() => {
    if (step === null) return;

    const timer = window.setTimeout(advance, STEP_MS);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        stop();
        return;
      }
      // Ignore typing in a field — the Services step types into the chat box.
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      advance();
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [step, advance, stop]);

  if (step === null) return null;

  const caption = dict.demo[steps[step].captionKey];

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-accent bg-surface"
    >
      <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3">
        <span className="label text-accent">
          {dict.demo.badge} {step + 1}/{steps.length}
        </span>
        <p className="min-w-0 flex-1 text-ink">{caption}</p>
        <p className="meta text-subtle">{dict.demo.advanceHint}</p>
        <button
          type="button"
          onClick={stop}
          className="meta rounded-chip border border-border px-2 py-1 text-ink-2 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {dict.demo.stop}
        </button>
      </div>
    </div>
  );
}
