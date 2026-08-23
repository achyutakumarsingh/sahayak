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
    <div className="px-5 py-12 sm:py-16 lg:pl-[12vw] xl:pl-[190px] lg:pr-16 lg:pt-[140px] xl:pt-[190px] lg:pb-24 max-w-7xl">
      {/* Hero. Left-aligned, and the only thing above the grid — the size jump
          against unchanged body copy is what carries it. */}
      <Reveal>
        <p className="label">{dict.home.eyebrow}</p>
        <h1 className="display mt-5 max-w-[20ch] text-[length:var(--text-hero)] text-ink">
          {dict.home.heroLead ?? (Array.isArray(dict.home.hero) ? `${dict.home.hero[0]} ${dict.home.hero[1]} ` : "One trained model. Eight communities. ")}
          <span className="text-accent">{dict.home.heroAccent ?? (Array.isArray(dict.home.hero) ? dict.home.hero[2] : "Grounded answers, or none at all.")}</span>
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

        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
