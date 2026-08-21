import { notFound } from "next/navigation";

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
      <p className="label">{dict.home.eyebrow}</p>
      <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-ink">
        {dict.home.heading}
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-ink-2">{dict.home.intro}</p>

      <section aria-labelledby="modules-heading" className="mt-10 sm:mt-12">
        <SectionHeader
          index={1}
          title={dict.home.modulesLabel}
          id="modules-heading"
          action={<span className="meta">{dict.home.moduleCount}</span>}
        />

        <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => (
            <ModuleCard
              key={module.slug}
              module={module}
              locale={locale}
              dict={dict}
            />
          ))}
        </ul>
      </section>
    </div>
  );
}
