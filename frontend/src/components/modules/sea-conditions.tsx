"use client";

import { useCallback, useEffect, useState } from "react";

import { Button, Card, Disclaimer, StatusDot, type StatusTone } from "@/components/ui";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { apiUrl } from "@/lib/api";
import { cn } from "@/lib/cn";

type District = {
  slug: string;
  name: Record<string, string>;
  state: Record<string, string>;
};

type Readings = {
  district: string;
  observedAt: string | null;
  waveHeight: number | null;
  wavePeriod: number | null;
  swellHeight: number | null;
  windSpeed: number | null;
  windGusts: number | null;
  windDirection: number | null;
  units: Record<string, string>;
  source: string;
};

type VerdictLevel = "safe" | "caution" | "danger";
type Verdict = { level: VerdictLevel; headline: string; advice: string };

const TONE: Record<VerdictLevel, StatusTone> = {
  safe: "ok",
  caution: "warn",
  danger: "danger",
};

const BORDER: Record<VerdictLevel, string> = {
  safe: "border-ok/50",
  caution: "border-warn/50",
  danger: "border-danger/50",
};

/** Reading + unit, or an em dash when the field came back null. */
function Reading({
  label,
  value,
  unit,
}: {
  label: string;
  value: number | null;
  unit?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border py-2 last:border-b-0">
      <span className="label">{label}</span>
      <span className="meta text-ink">
        {value === null || value === undefined ? "—" : `${value} ${unit ?? ""}`.trim()}
      </span>
    </div>
  );
}

export function SeaConditions({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const t = dict.sea;

  const [districts, setDistricts] = useState<District[]>([]);
  const [selected, setSelected] = useState("kochi");
  const [readings, setReadings] = useState<Readings | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [loading, setLoading] = useState(true);
  const [verdictPending, setVerdictPending] = useState(false);
  const [readingsError, setReadingsError] = useState<string | null>(null);
  const [verdictNote, setVerdictNote] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(apiUrl("/api/fishermen/districts"), { signal: controller.signal })
      .then((r) => r.json())
      .then((body: { districts: District[] }) => setDistricts(body.districts ?? []))
      .catch(() => {
        /* picker stays empty; the readings error explains why */
      });
    return () => controller.abort();
  }, []);

  const load = useCallback(
    async (district: string) => {
      // Callers flip `loading` before invoking this; doing it here would mean
      // a synchronous setState inside the mount effect.
      // Readings first and on their own: they never depend on an API key, so
      // a crew still sees real numbers when the verdict cannot be generated.
      try {
        const response = await fetch(
          apiUrl(`/api/fishermen/conditions?district=${encodeURIComponent(district)}`),
        );
        if (!response.ok) throw new Error(String(response.status));
        setReadings((await response.json()) as Readings);
      } catch {
        setReadings(null);
        setReadingsError(t.errorReadings);
        setLoading(false);
        return;
      }
      setLoading(false);
      setReadingsError(null);

      setVerdictPending(true);
      try {
        const response = await fetch(apiUrl("/api/fishermen/verdict"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ district, language: locale }),
        });
        if (response.ok) {
          const body = (await response.json()) as { verdict: Verdict };
          setVerdict(body.verdict);
        } else {
          const body = (await response.json().catch(() => ({}))) as { detail?: string };
          setVerdictNote(
            response.status === 503 ? t.verdictUnavailable : body.detail ?? t.verdictUnavailable,
          );
        }
      } catch {
        setVerdictNote(t.verdictUnavailable);
      } finally {
        setVerdictPending(false);
      }
    },
    [locale, t],
  );

  useEffect(() => {
    // Fetching when the selected district changes is exactly what an effect is
    // for; the rule's heuristic cannot see that every setState inside load()
    // happens after an await.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(selected);
  }, [selected, load]);

  const reload = (district: string) => {
    setLoading(true);
    setVerdict(null);
    setVerdictNote(null);
    setReadingsError(null);
    void load(district);
  };

  return (
    <section aria-labelledby="sea-heading" className="flex flex-col gap-4">
      <div>
        <h2 id="sea-heading" className="text-lg font-semibold tracking-tight text-ink">
          {t.title}
        </h2>
        <p className="mt-1 text-ink-2">{t.intro}</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-52 flex-col gap-1.5">
          <label htmlFor="district" className="label">
            {t.districtLabel}
          </label>
          <select
            id="district"
            value={selected}
            onChange={(e) => {
              setLoading(true);
              setVerdict(null);
              setVerdictNote(null);
              setSelected(e.target.value);
            }}
            className={cn(
              "rounded-chip border border-border bg-surface px-3 py-2 text-ink",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
            )}
          >
            {districts.map((d) => (
              <option key={d.slug} value={d.slug}>
                {d.name[locale] ?? d.name.en} — {d.state[locale] ?? d.state.en}
              </option>
            ))}
          </select>
        </div>
        <Button size="sm" withArrow={false} onClick={() => reload(selected)} disabled={loading}>
          {t.refresh}
        </Button>
      </div>

      {readingsError ? (
        <p role="alert" className="text-danger">
          {readingsError}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-baseline justify-between gap-3">
            <p className="label">{t.readingsLabel}</p>
            {readings?.observedAt ? (
              <p className="meta">
                {t.observedAt} {readings.observedAt.replace("T", " ")}
              </p>
            ) : null}
          </div>

          <div className="mt-3" aria-busy={loading} aria-live="polite">
            {loading ? (
              <p className="meta">{t.loading}</p>
            ) : readings ? (
              <>
                <Reading label={t.waveHeight} value={readings.waveHeight} unit={readings.units.waveHeight} />
                <Reading label={t.swellHeight} value={readings.swellHeight} unit={readings.units.swellHeight} />
                <Reading label={t.wavePeriod} value={readings.wavePeriod} unit={readings.units.wavePeriod} />
                <Reading label={t.windSpeed} value={readings.windSpeed} unit={readings.units.windSpeed} />
                <Reading label={t.windGusts} value={readings.windGusts} unit={readings.units.windGusts} />
                <Reading label={t.windDirection} value={readings.windDirection} unit={readings.units.windDirection} />
              </>
            ) : null}
          </div>

          {readings ? (
            <p className="meta mt-3 text-subtle">
              {t.source}: {readings.source}
            </p>
          ) : null}
        </Card>

        <Card
          className={cn("flex flex-col", verdict ? BORDER[verdict.level] : undefined)}
          aria-busy={verdictPending}
        >
          <p className="label">{t.verdictLabel}</p>

          <div className="mt-3" aria-live="polite">
            {verdictPending ? (
              <p className="meta">{t.verdictPending}</p>
            ) : verdict ? (
              <div className="flex flex-col gap-2">
                <StatusDot tone={TONE[verdict.level]} label={t.levels[verdict.level]} />
                <p className="text-lg font-semibold tracking-tight text-ink">{verdict.headline}</p>
                <p className="text-ink-2">{verdict.advice}</p>
              </div>
            ) : (
              <p className="text-ink-2">{verdictNote}</p>
            )}
          </div>

          <p className="meta mt-auto pt-4 text-subtle">{t.samplePoint}</p>
        </Card>
      </div>

      <Disclaimer tone="advice" label={dict.disclaimer.verifyLabel}>
        {t.official}
      </Disclaimer>
    </section>
  );
}
