import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

import { Specimens } from "./specimens";

export const metadata: Metadata = {
  title: "Styleguide",
  description: "Every Sahayak base component, in both themes.",
  robots: { index: false, follow: false },
};

const THEMES = [
  { theme: "light", title: "Light", note: "Default · prefers-color-scheme: light" },
  { theme: "dark", title: "Dark", note: "prefers-color-scheme: dark · [data-theme]" },
] as const;

export default async function StyleguidePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  return (
    <div className="mx-auto max-w-[110rem] px-5 py-12">
      <p className="label">/00 · Internal</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink">
        Styleguide
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-ink-2">
        Every base component rendered against both palettes at once. Each panel
        sets <code className="meta">data-theme</code> on its wrapper, so what you
        see is the real cascade — not a screenshot or a mock.
      </p>
      <p className="mt-3 max-w-2xl text-ink-2">
        Tab through the panels to check focus states. Swatch values are read
        live from the DOM, so they always match{" "}
        <code className="meta">globals.css</code>.
      </p>

      <div className="mt-10 grid gap-6 xl:grid-cols-2">
        {THEMES.map(({ theme, title, note }) => (
          <section
            key={theme}
            data-theme={theme}
            aria-label={`${title} theme`}
            className="rounded-card border border-border bg-bg p-6 text-ink sm:p-8"
          >
            <div className="mb-8 flex items-baseline justify-between gap-4 border-b border-border pb-4">
              <h2 className="text-xl font-semibold tracking-tight text-ink">
                {title}
              </h2>
              <p className="meta">{note}</p>
            </div>
            <Specimens locale={locale} dict={dict} />
          </section>
        ))}
      </div>
    </div>
  );
}
