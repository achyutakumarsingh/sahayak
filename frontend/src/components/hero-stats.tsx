"use client";

import { useEffect, useState } from "react";

import { CountUp } from "@/components/count-up";
import type { Dictionary } from "@/i18n/get-dictionary";
import { apiUrl } from "@/lib/api";

type Stats = { diagnoses: number; schemeMatches: number; questions: number };

/**
 * Live counters under the hero. No card, no border, no shadow — a plain row of
 * mono numbers against the page.
 */
export function HeroStats({ dict }: { dict: Dictionary }) {
  const t = dict.impact;
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(apiUrl("/api/stats"), { signal: controller.signal })
      .then((r) => r.json())
      .then((body: { stats: Stats }) => setStats(body.stats))
      .catch(() => {
        /* the strip simply stays out of the way if the backend is down */
      });
    return () => controller.abort();
  }, []);

  if (!stats) return null;

  const rows: Array<[string, number]> = [
    [t.diagnoses, stats.diagnoses],
    [t.schemeMatches, stats.schemeMatches],
    [t.questions, stats.questions],
  ];

  return (
    <dl className="mt-8 flex flex-wrap gap-x-12 gap-y-4">
      {rows.map(([label, value]) => (
        <div key={label} className="flex flex-col gap-1">
          <dd className="meta text-2xl text-ink tabular-nums">
            <CountUp value={value} />
          </dd>
          <dt className="label">{label}</dt>
        </div>
      ))}
    </dl>
  );
}
