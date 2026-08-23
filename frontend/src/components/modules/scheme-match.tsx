"use client";

import { useState, type FormEvent } from "react";

import { Button, Card, Disclaimer } from "@/components/ui";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { apiUrl } from "@/lib/api";
import { cn } from "@/lib/cn";

type Scheme = {
  id: string;
  verified: boolean;
  name: Record<string, string>;
  summary: Record<string, string>;
  documents: Record<string, string[]>;
  failedOn?: string[];
};

type Result = {
  matched: Scheme[];
  notMatched: Scheme[];
  datasetVerified: boolean;
  source: string;
};

const FIELD =
  "w-full rounded-chip border border-border bg-surface px-3 py-2 text-ink " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function SchemeMatch({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const t = dict.vendor;

  const [occupation, setOccupation] = useState("vendor");
  const [age, setAge] = useState("34");
  const [income, setIncome] = useState("220000");
  const [gender, setGender] = useState("unspecified");
  const [certificate, setCertificate] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reasonLabel = (key: string) =>
    ({
      occupation: t.reasonOccupation,
      gender: t.reasonGender,
      income: t.reasonIncome,
      age: t.reasonAge,
      vending_certificate: t.reasonVendingCertificate,
    })[key] ?? key;

  const localise = (map: Record<string, string>) => map?.[locale] ?? map?.en ?? "";

  async function check(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(apiUrl("/api/vendors/schemes"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          occupation,
          age: Number(age) || 0,
          annual_income_inr: Number(income) || 0,
          gender,
          has_vending_certificate: certificate,
          language: locale,
        }),
      });
      if (!response.ok) throw new Error(String(response.status));
      setResult((await response.json()) as Result);
    } catch {
      setError(t.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="flex flex-col gap-5">
      <div>
        <h3 className="text-lg font-semibold tracking-tight text-ink">{t.schemeTitle}</h3>
        <p className="mt-1 text-ink-2">{t.schemeIntro}</p>
      </div>

      <form onSubmit={check} className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="sm-occupation" className="label">{t.occupation}</label>
          <select id="sm-occupation" value={occupation} onChange={(e) => setOccupation(e.target.value)} className={FIELD}>
            <option value="vendor">{t.occVendor}</option>
            <option value="artisan">{t.occArtisan}</option>
            <option value="other">{t.occOther}</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="sm-gender" className="label">{t.gender}</label>
          <select id="sm-gender" value={gender} onChange={(e) => setGender(e.target.value)} className={FIELD}>
            <option value="unspecified">{t.genderUnspecified}</option>
            <option value="female">{t.genderFemale}</option>
            <option value="male">{t.genderMale}</option>
            <option value="other">{t.genderOther}</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="sm-age" className="label">{t.age}</label>
          <input id="sm-age" type="number" inputMode="numeric" min="14" max="120" value={age}
                 onChange={(e) => setAge(e.target.value)} className={cn(FIELD, "font-mono")} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="sm-income" className="label">{t.income}</label>
          <input id="sm-income" type="number" inputMode="numeric" min="0" step="1000" value={income}
                 onChange={(e) => setIncome(e.target.value)} className={cn(FIELD, "font-mono")} />
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
          <label className="flex items-center gap-2 text-ink">
            <input type="checkbox" checked={certificate} onChange={(e) => setCertificate(e.target.checked)}
                   className="size-4 accent-accent" />
            {t.certificate}
          </label>
          <Button type="submit" variant="primary" withArrow disabled={busy}>
            {busy ? t.checking : t.checkSchemes}
          </Button>
        </div>
      </form>

      <div aria-live="polite" aria-busy={busy}>
        {result ? (
          <div className="flex flex-col gap-4">
            <div>
              <p className="label">{t.matched}</p>
              {result.matched.length === 0 ? (
                <p className="mt-2 text-ink-2">{t.noMatches}</p>
              ) : (
                <ul className="mt-2 flex flex-col gap-3">
                  {result.matched.map((scheme) => (
                    <li key={scheme.id} className="rounded-card border border-ok/50 bg-surface-2 pad-sm">
                      <p className="font-medium text-ink">{localise(scheme.name)}</p>
                      <p className="mt-1 text-ink-2">{localise(scheme.summary)}</p>
                      <p className="meta mt-2">
                        {t.documents}: {(scheme.documents?.[locale] ?? scheme.documents?.en ?? []).join(" · ")}
                      </p>
                      {/* Deterministic match, so the exact record is citable. */}
                      <p className="meta mt-1 text-subtle">
                        {dict.chat.source}: {result.source} · {scheme.id}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {result.notMatched.length > 0 ? (
              <div>
                <p className="label">{t.notMatched}</p>
                <ul className="mt-2 flex flex-col gap-2">
                  {result.notMatched.map((scheme) => (
                    <li key={scheme.id} className="rounded-card border border-border pad-sm">
                      <p className="text-ink-2">{localise(scheme.name)}</p>
                      <p className="meta mt-1">
                        {t.failedOn}: {(scheme.failedOn ?? []).map(reasonLabel).join(", ")}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <p className="meta text-subtle">{t.source}: {result.source}</p>
          </div>
        ) : null}

        <p role="alert" className="min-h-5 text-xs text-danger">{error}</p>
      </div>

      <Disclaimer tone="sample" label={t.unverifiedLabel}>{t.unverifiedBody}</Disclaimer>
    </Card>
  );
}
