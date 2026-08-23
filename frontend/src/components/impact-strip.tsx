"use client";

import { useEffect, useState } from "react";

import { CountUp } from "@/components/count-up";
import type { Dictionary } from "@/i18n/get-dictionary";
import { apiUrl } from "@/lib/api";

type Stats = { diagnoses: number; schemeMatches: number; questions: number };

/**
 * Collapsible counters for the home screen. Deliberately plain: these are
 * requests served, not a measure of anyone actually being helped, and the
 * copy says so rather than dressing them up as outcomes.
 */
export function ImpactStrip({ dict }: { dict: Dictionary }) {
  const t = dict.impact;

  const [open, setOpen] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!open || stats) return;
    const controller = new AbortController();
    fetch(apiUrl("/api/stats"), { signal: controller.signal })
      .then((r) => r.json())
      .then((body: { stats: Stats }) => setStats(body.stats))
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, [open, stats]);

  const rows: Array<[string, number | null]> = [
    [t.diagnoses, stats?.diagnoses ?? null],
    [t.schemeMatches, stats?.schemeMatches ?? null],
    [t.questions, stats?.questions ?? null],
  ];

  return (
    <section aria-labelledby="impact-heading" className="mt-12 border-t border-border pt-5">
      <h2 id="impact-heading" className="sr-only">
        {t.title}
      </h2>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="impact-panel"
        className="label flex items-center gap-2 rounded-chip py-1 text-ink-2 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <span aria-hidden="true">{open ? "−" : "+"}</span>
        {open ? t.hide : t.show}
      </button>

      <div id="impact-panel" hidden={!open} className="mt-4">
        <p className="text-xs text-ink-2">{t.intro}</p>

        {failed ? (
          <p className="meta mt-3">{t.unavailable}</p>
        ) : (
          <dl className="mt-3 grid gap-4 sm:grid-cols-3">
            {rows.map(([label, value]) => (
              <div key={label} className="flex flex-col gap-1">
                <dt className="label">{label}</dt>
                <dd className="meta text-2xl text-ink tabular-nums">
                  {value === null ? "—" : <CountUp value={value} />}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}
