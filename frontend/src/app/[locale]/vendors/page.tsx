import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ChatPanel } from "@/components/chat-panel";
import { DailyLog } from "@/components/modules/daily-log";
import { SchemeMatch } from "@/components/modules/scheme-match";
import { SectionHeader, StatusDot } from "@/components/ui";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getModule, modules } from "@/lib/modules";

const SLUG = "vendors" as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return { title: dict.modules[SLUG].name, description: dict.modules[SLUG].description };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  const def = getModule(SLUG);
  const copy = dict.modules[SLUG];
  const index = modules.findIndex((m) => m.slug === SLUG) + 1;

  return (
    <article className="mx-auto flex max-w-5xl flex-col gap-10 px-5 py-10 sm:py-12">
      <SectionHeader
        as="h1"
        index={index}
        eyebrow={copy.community}
        title={copy.name}
        description={copy.description}
        action={<StatusDot tone="ok" label={copy.community} />}
      />

      <div className="grid items-start gap-6 xl:grid-cols-2">
        <DailyLog locale={locale} dict={dict} />
        <SchemeMatch locale={locale} dict={dict} />
      </div>

      <ChatPanel module={SLUG} locale={locale} dict={dict} />

      <p className="meta">
        {def.monogram} · grounding/{SLUG}.json · grounding/services.json
      </p>
    </article>
  );
}
