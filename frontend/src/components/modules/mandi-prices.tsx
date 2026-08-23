"use client";

/* eslint-disable react-hooks/set-state-in-effect --
   This component fetches when the selected commodity changes, which is what an
   effect is for. The rule traces every setState reachable from load() and
   cannot tell that they all run after an await. Moving the fetch out of the
   effect would mean no prices until the farmer clicks, which is worse. */

import { useCallback, useEffect, useState } from "react";

import { Button, Card, Disclaimer } from "@/components/ui";
import type { Dictionary } from "@/i18n/get-dictionary";
import { apiUrl } from "@/lib/api";
import { cn } from "@/lib/cn";

type Row = {
  commodity: string | null;
  variety: string | null;
  state: string | null;
  district: string | null;
  market: string | null;
  arrivalDate: string | null;
  minPrice: number | null;
  modalPrice: number | null;
  maxPrice: number | null;
};

type Payload = {
  records: Row[];
  count: number;
  unit: string;
  source: string;
  usingSampleKey: boolean;
};

const COMMODITIES = ["Wheat", "Paddy(Dhan)(Common)", "Cotton", "Potato", "Onion", "Tomato", "Maize"];

const FIELD =
  "rounded-chip border border-border bg-surface px-3 py-2 text-ink " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function MandiPrices({ dict }: { dict: Dictionary }) {
  const t = dict.farmer;

  const [commodity, setCommodity] = useState("Wheat");
  const [data, setData] = useState<Payload | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (crop: string) => {
      // No setState before the first await — callers own the "start loading"
      // transition so the mount effect never sets state synchronously.
      try {
        const response = await fetch(
          apiUrl(`/api/farmers/mandi?commodity=${encodeURIComponent(crop)}&limit=12`),
        );
        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { detail?: string };
          setData(null);
          setError(response.status === 429 ? t.mandiRateLimited : body.detail ?? t.mandiError);
          return;
        }
        setData((await response.json()) as Payload);
      } catch {
        setData(null);
        setError(t.mandiError);
      } finally {
        setBusy(false);
      }
    },
    [t],
  );

  useEffect(() => {
    void load(commodity);
  }, [commodity, load]);

  return (
    <section aria-labelledby="mandi-heading" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 id="mandi-heading" className="text-lg font-semibold tracking-tight text-ink">
            {t.mandiTitle}
          </h2>
          <p className="mt-1 text-ink-2">{t.mandiIntro}</p>
        </div>

        {/* Live indicator: opacity pulse only, and it appears only once real
            rows have actually arrived. */}
        {data && data.records.length > 0 ? (
          <p className="meta flex items-center gap-2 text-ink-2">
            <span aria-hidden="true" className="pulse-dot size-1.5 rounded-full bg-accent" />
            {t.live}
            {data.records[0]?.arrivalDate ? ` · ${data.records[0].arrivalDate}` : ""}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="mandi-commodity" className="label">
            {t.commodity}
          </label>
          <select
            id="mandi-commodity"
            value={commodity}
            onChange={(e) => {
              setBusy(true);
              setError(null);
              setCommodity(e.target.value);
            }}
            className={FIELD}
          >
            {COMMODITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <Button
          size="sm"
          withArrow={false}
          onClick={() => {
            setBusy(true);
            setError(null);
            void load(commodity);
          }}
          disabled={busy}
        >
          {busy ? t.loadingPrices : t.loadPrices}
        </Button>
      </div>

      <Card padding="none">
        <div className="overflow-x-auto" aria-busy={busy} aria-live="polite">
          {busy ? (
            <p className="meta pad-md">{t.loadingPrices}</p>
          ) : data && data.records.length > 0 ? (
            <table className="w-full min-w-[38rem] border-collapse">
              <thead>
                <tr className="border-b border-border">
                  {[t.market, t.state, t.min, t.modal, t.max, t.arrival].map((h, i) => (
                    <th
                      key={h}
                      scope="col"
                      className={cn("label px-4 py-2", i >= 2 && i <= 4 ? "text-right" : "text-left")}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.records.map((r, i) => (
                  <tr key={`${r.market}-${i}`} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-2 text-ink">{r.market ?? "—"}</td>
                    <td className="px-4 py-2 text-ink-2">{r.state ?? "—"}</td>
                    <td className="meta px-4 py-2 text-right text-ink">{r.minPrice ?? "—"}</td>
                    <td className="meta px-4 py-2 text-right font-medium text-ink">{r.modalPrice ?? "—"}</td>
                    <td className="meta px-4 py-2 text-right text-ink">{r.maxPrice ?? "—"}</td>
                    <td className="meta px-4 py-2 text-ink-2">{r.arrivalDate ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : error ? (
            <p role="alert" className="pad-md text-danger">
              {error}
            </p>
          ) : (
            <p className="pad-md text-ink-2">{t.noPrices}</p>
          )}
        </div>

        {data ? (
          <p className="meta border-t border-border px-4 py-2 text-subtle">
            {t.mandiSource}: {data.source} · {data.unit}
          </p>
        ) : null}
      </Card>

      {data?.usingSampleKey ? (
        <Disclaimer tone="sample" label={t.sampleKeyLabel}>
          {t.sampleKeyBody}
        </Disclaimer>
      ) : null}
    </section>
  );
}
