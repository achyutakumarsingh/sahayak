import { ModuleCard } from "@/components/module-card";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { modules } from "@/lib/modules";
import { notFound } from "next/navigation";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <p className="label">{dict.home.eyebrow}</p>
      <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-fg">
        {dict.home.heading}
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">{dict.home.intro}</p>

      <section aria-labelledby="modules-heading" className="mt-12">
        <div className="flex items-baseline justify-between border-b border-hairline pb-2">
          <h2 id="modules-heading" className="label">
            {dict.home.modulesLabel}
          </h2>
          <p className="meta">{dict.home.moduleCount}</p>
        </div>

        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
