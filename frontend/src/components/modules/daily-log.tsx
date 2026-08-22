"use client";

import { useCallback, useState, useSyncExternalStore, type FormEvent } from "react";

import { Button, Card, StatusDot } from "@/components/ui";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { apiUrl } from "@/lib/api";
import { cn } from "@/lib/cn";
import { VENDOR_LOG_KEY } from "@/lib/storage";

export type Entry = {
  date: string;
  sales_inr: number;
  stock_cost_inr: number;
  unsold_units?: number;
};

type Demand = { headline: string; note: string; confidence: "low" | "medium" };

const FIELD =
  "w-full rounded-chip border border-border bg-surface px-3 py-2 text-ink " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

/* The log is an external store, read through useSyncExternalStore: React
   hydrates with the empty server snapshot and re-renders with the saved rows,
   so there is no mismatch and no setState inside an effect. */

const EMPTY: Entry[] = [];
const listeners = new Set<() => void>();

let cachedRaw: string | null = null;
let cachedEntries: Entry[] = EMPTY;

function rawLog(): string | null {
  try {
    return window.localStorage.getItem(VENDOR_LOG_KEY);
  } catch {
    return null;
  }
}

// Must be referentially stable between reads or React re-renders forever.
function getSnapshot(): Entry[] {
  const raw = rawLog();
  if (raw === cachedRaw) return cachedEntries;
  cachedRaw = raw;
  try {
    const parsed = raw ? (JSON.parse(raw) as Entry[]) : EMPTY;
    cachedEntries = Array.isArray(parsed) ? parsed : EMPTY;
  } catch {
    cachedEntries = EMPTY;
  }
  return cachedEntries;
}

function getServerSnapshot(): Entry[] {
  return EMPTY;
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function writeLog(entries: Entry[]) {
  try {
    window.localStorage.setItem(VENDOR_LOG_KEY, JSON.stringify(entries));
  } catch {
    /* private mode — the log lives for this page view only */
  }
  // `storage` does not fire in the tab that made the change.
  listeners.forEach((listener) => listener());
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function DailyLog({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const t = dict.vendor;

  const entries = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [date, setDate] = useState(today);
  const [sales, setSales] = useState("");
  const [stock, setStock] = useState("");
  const [unsold, setUnsold] = useState("");
  const [demand, setDemand] = useState<Demand | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState(false);

  const persist = useCallback((next: Entry[]) => writeLog(next), []);

  function save(event: FormEvent) {
    event.preventDefault();
    const salesValue = Number(sales);
    const stockValue = Number(stock);

    if (!Number.isFinite(salesValue) || !Number.isFinite(stockValue) || sales === "" || stock === "") {
      setError(t.errorNumbers);
      return;
    }

    setError(null);
    const entry: Entry = {
      date: date || today(),
      sales_inr: Math.max(0, salesValue),
      stock_cost_inr: Math.max(0, stockValue),
      ...(unsold !== "" && Number.isFinite(Number(unsold))
        ? { unsold_units: Math.max(0, Math.round(Number(unsold))) }
        : {}),
    };

    // One row per date: saving the same day again replaces it.
    const next = [...entries.filter((e) => e.date !== entry.date), entry].sort((a, b) =>
      a.date < b.date ? 1 : -1,
    );
    persist(next);
    setSales("");
    setStock("");
    setUnsold("");
    setSavedAt(true);
    window.setTimeout(() => setSavedAt(false), 1600);
  }

  async function getNote() {
    if (entries.length === 0) return;
    setBusy(true);
    setError(null);
    setDemand(null);

    try {
      const response = await fetch(apiUrl("/api/vendors/demand-note"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: entries.slice(0, 7), language: locale }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { detail?: string };
        setError(response.status === 503 ? t.errorNotConfigured : body.detail ?? t.errorGeneric);
        return;
      }
      const body = (await response.json()) as { demand: Demand };
      setDemand(body.demand);
    } catch {
      setError(t.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  const recent = entries.slice(0, 7);

  return (
    <Card className="flex flex-col gap-5">
      <div>
        <h3 className="text-lg font-semibold tracking-tight text-ink">{t.logTitle}</h3>
        <p className="mt-1 text-ink-2">{t.logIntro}</p>
      </div>

      <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="log-date" className="label">{t.dateLabel}</label>
          <input id="log-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={FIELD} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="log-sales" className="label">{t.salesLabel}</label>
          <input id="log-sales" type="number" inputMode="numeric" min="0" step="1" value={sales}
                 onChange={(e) => setSales(e.target.value)} className={cn(FIELD, "font-mono")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="log-stock" className="label">{t.stockLabel}</label>
          <input id="log-stock" type="number" inputMode="numeric" min="0" step="1" value={stock}
                 onChange={(e) => setStock(e.target.value)} className={cn(FIELD, "font-mono")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="log-unsold" className="label">{t.unsoldLabel}</label>
          <input id="log-unsold" type="number" inputMode="numeric" min="0" step="1" value={unsold}
                 onChange={(e) => setUnsold(e.target.value)} className={cn(FIELD, "font-mono")} />
        </div>
        <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
          <Button type="submit" variant="primary" withArrow>{t.save}</Button>
          {savedAt ? <span className="meta text-ok">{t.saved}</span> : null}
          {entries.length > 0 ? (
            <Button type="button" size="sm" withArrow={false} onClick={() => persist([])}>{t.clearAll}</Button>
          ) : null}
        </div>
      </form>

      <div>
        <div className="flex items-baseline justify-between gap-3 border-b border-border pb-2">
          <p className="label">{t.recent}</p>
          <p className="meta">{t.entriesCount.replace("{n}", String(entries.length))}</p>
        </div>

        {recent.length === 0 ? (
          <p className="mt-3 text-ink-2">{t.noEntries}</p>
        ) : (
          <ul className="mt-1">
            {recent.map((entry) => {
              const earned = entry.sales_inr - entry.stock_cost_inr;
              return (
                <li key={entry.date}
                    className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border py-2 last:border-b-0">
                  <span className="meta text-ink">{entry.date}</span>
                  <span className="meta">
                    ₹{entry.sales_inr.toLocaleString("en-IN")} − ₹{entry.stock_cost_inr.toLocaleString("en-IN")}
                    {entry.unsold_units !== undefined ? ` · ${entry.unsold_units}` : ""}
                  </span>
                  <span className={cn("meta", earned >= 0 ? "text-ok" : "text-danger")}>
                    {t.earned} ₹{earned.toLocaleString("en-IN")}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="border-t border-border pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="label">{t.noteTitle}</p>
          <Button size="sm" withArrow onClick={() => void getNote()} disabled={busy || entries.length === 0}>
            {busy ? t.noteGenerating : t.noteGenerate}
          </Button>
        </div>

        <div className="mt-3" aria-live="polite" aria-busy={busy}>
          {busy ? (
            <p className="meta">{t.noteGenerating}</p>
          ) : demand ? (
            <div className="flex flex-col gap-2">
              <p className="text-lg font-semibold tracking-tight text-ink">{demand.headline}</p>
              <p className="text-ink-2">{demand.note}</p>
              <StatusDot
                tone={demand.confidence === "medium" ? "info" : "warn"}
                label={`${t.confidence}: ${demand.confidence === "medium" ? t.confidenceMedium : t.confidenceLow}`}
              />
            </div>
          ) : entries.length === 0 ? (
            <p className="text-ink-2">{t.noteEmpty}</p>
          ) : null}
        </div>
      </div>

      <p role="alert" aria-live="assertive" className="min-h-5 text-xs text-danger">{error}</p>
      <p className="meta text-subtle">{t.localOnly}</p>
    </Card>
  );
}
