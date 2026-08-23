import { notFound } from "next/navigation";

import { HeroStats } from "@/components/hero-stats";
import { ImpactStrip } from "@/components/impact-strip";
import { Reveal } from "@/components/reveal";
import { ModuleCard } from "@/components/module-card";
import { SectionHeader } from "@/components/ui";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { modules } from "@/lib/modules";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:py-12">
      {/* Hero. Left-aligned, and the only thing above the grid — the size jump
          against unchanged body copy is what carries it. */}
      <Reveal>
        <p className="label">{dict.home.eyebrow}</p>
        <h1 className="display mt-5 max-w-[19ch] text-[length:var(--text-hero)] text-ink">
          {dict.home.heroLead}
          {/* Exactly one accent phrase in the headline. */}
          <span className="text-accent">{dict.home.heroAccent}</span>
        </h1>
      </Reveal>
      <Reveal delay={80}>
        <p className="mt-8 max-w-2xl text-lg text-ink-2">{dict.home.intro}</p>
        <HeroStats dict={dict} />
      </Reveal>

      <section aria-labelledby="modules-heading" className="mt-16 sm:mt-20">
        <SectionHeader
          index={1}
          title={dict.home.modulesLabel}
          id="modules-heading"
          action={<span className="meta">{dict.home.moduleCount}</span>}
        />

        <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {modules.map((module, index) => (
            <Reveal
              key={module.slug}
              // ~80ms between siblings, capped so the last card is not left
              // waiting half a second.
              delay={Math.min(index, 5) * 80}
              as="li"
            >
              <ModuleCard module={module} locale={locale} dict={dict} />
            </Reveal>
          ))}
        </ul>
      </section>

      <ImpactStrip dict={dict} />
    </div>
  );
}
