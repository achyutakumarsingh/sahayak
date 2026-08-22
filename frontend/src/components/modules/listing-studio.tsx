"use client";

import { useCallback, useRef, useState } from "react";

import { Button, Card, Disclaimer } from "@/components/ui";
import { localeNames, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { apiUrl } from "@/lib/api";
import { cn } from "@/lib/cn";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 5 * 1024 * 1024;

type Listing = {
  title_en: string;
  title_local: string;
  description_en: string;
  description_local: string;
  price_min_inr: number;
  price_max_inr: number;
  tags_en: string[];
  tags_local: string[];
};

/** Copy-to-clipboard button that confirms in place. */
function CopyButton({
  value,
  label,
  copyText,
  copiedText,
}: {
  value: string;
  label: string;
  copyText: string;
  copiedText: string;
}) {
  const [done, setDone] = useState(false);

  return (
    <button
      type="button"
      aria-label={label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          window.setTimeout(() => setDone(false), 1600);
        } catch {
          /* clipboard blocked — the text is on screen to select by hand */
        }
      }}
      className={cn(
        "meta shrink-0 rounded-chip border border-border px-2 py-1 transition-colors",
        "hover:border-ink-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        done ? "text-ok" : "text-ink-2",
      )}
    >
      {done ? copiedText : copyText}
    </button>
  );
}

/** One field, rendered once per language column. */
function Field({
  label,
  value,
  langLabel,
  dict,
  fieldName,
}: {
  label: string;
  value: string;
  langLabel: string;
  dict: Dictionary;
  fieldName: string;
}) {
  const t = dict.listing;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="label">{langLabel}</span>
        <CopyButton
          value={value}
          label={t.copyField.replace("{field}", fieldName).replace("{lang}", langLabel)}
          copyText={t.copy}
          copiedText={t.copied}
        />
      </div>
      <p className="whitespace-pre-wrap text-ink">{value}</p>
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function ListingStudio({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const t = dict.listing;
  const bilingual = locale !== "en";
  const localLabel = localeNames[locale];

  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [payload, setPayload] = useState<{ base64: string; mediaType: string } | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onPick = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      setListing(null);
      setError(null);

      if (!ALLOWED.includes(file.type)) {
        setError(t.errorType);
        return;
      }
      if (file.size > MAX_BYTES) {
        setError(t.errorSize);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result);
        setPreview(result);
        // Strip the "data:image/png;base64," prefix — the API wants raw base64.
        setPayload({ base64: result.split(",")[1] ?? "", mediaType: file.type });
      };
      reader.readAsDataURL(file);
    },
    [t],
  );

  async function generate() {
    if (!payload) return;
    setBusy(true);
    setError(null);
    setListing(null);

    try {
      const response = await fetch(apiUrl("/api/artisans/listing"), {
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
        setError(
          response.status === 503 ? t.errorNotConfigured : body.detail ?? t.errorGeneric,
        );
        return;
      }

      const body = (await response.json()) as { listing: Listing };
      setListing(body.listing);
    } catch {
      setError(t.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  const price = listing
    ? `₹${listing.price_min_inr.toLocaleString("en-IN")} – ₹${listing.price_max_inr.toLocaleString("en-IN")}`
    : "";

  const rows = listing
    ? [
        { key: "title", label: t.fieldTitle, en: listing.title_en, local: listing.title_local },
        {
          key: "description",
          label: t.fieldDescription,
          en: listing.description_en,
          local: listing.description_local,
        },
        {
          key: "tags",
          label: t.fieldTags,
          en: listing.tags_en.join(", "),
          local: listing.tags_local.join(", "),
        },
      ]
    : [];

  return (
    <section aria-labelledby="listing-heading" className="flex flex-col gap-4">
      <div>
        <h2 id="listing-heading" className="text-lg font-semibold tracking-tight text-ink">
          {t.title}
        </h2>
        <p className="mt-1 text-ink-2">{t.intro}</p>
      </div>

      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={inputRef}
            id="product-photo"
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
            <Button type="button" variant="primary" withArrow onClick={() => void generate()} disabled={busy}>
              {busy ? t.generating : t.generate}
            </Button>
          ) : null}
        </div>

        {preview ? (
          <div className="flex flex-col gap-1.5">
            <span className="label">{t.preview}</span>
            {/* Local object URL, never uploaded anywhere but our own backend. */}
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

      <div aria-busy={busy} aria-live="polite">
        {busy ? (
          <p className="meta">{t.generating}</p>
        ) : listing ? (
          <div className="flex flex-col gap-4">
            {rows.map((row) => (
              <Card key={row.key}>
                <p className="label">{row.label}</p>
                <div
                  className={cn(
                    "mt-3 grid gap-4",
                    bilingual ? "sm:grid-cols-2 sm:divide-x sm:divide-border" : "",
                  )}
                >
                  <div className={bilingual ? "sm:pr-4" : ""}>
                    <Field
                      label={row.label}
                      value={row.en}
                      langLabel={t.columnEnglish}
                      dict={dict}
                      fieldName={row.label}
                    />
                  </div>
                  {bilingual ? (
                    <div className="sm:pl-4" lang={locale}>
                      <Field
                        label={row.label}
                        value={row.local}
                        langLabel={localLabel}
                        dict={dict}
                        fieldName={row.label}
                      />
                    </div>
                  ) : null}
                </div>
              </Card>
            ))}

            <Card>
              <p className="label">{t.fieldPrice}</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="meta text-xl text-ink">{price}</p>
                <CopyButton
                  value={price}
                  label={t.copyField.replace("{field}", t.fieldPrice).replace("{lang}", "INR")}
                  copyText={t.copy}
                  copiedText={t.copied}
                />
              </div>
              <p className="mt-2 text-xs text-ink-2">{t.priceNote}</p>
            </Card>
          </div>
        ) : (
          <p className="text-ink-2">{t.empty}</p>
        )}
      </div>

      <Disclaimer label={t.disclaimerLabel}>{t.disclaimerBody}</Disclaimer>
    </section>
  );
}
