import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ChatPanel } from "@/components/chat-panel";
import { SectionHeader, StatusDot } from "@/components/ui";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getModule, modules } from "@/lib/modules";

const SLUG = "fishermen" as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);

  return {
    title: dict.modules[SLUG].name,
    description: dict.modules[SLUG].description,
  };
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
    <article className="mx-auto max-w-3xl px-5 py-10 sm:py-12">
      <SectionHeader
        as="h1"
        index={index}
        eyebrow={copy.community}
        title={copy.name}
        description={copy.description}
        action={<StatusDot tone="warn" label={dict.status.scaffold} />}
      />

      {/* The whole grounded-agent surface: one component, one module id. */}
      <ChatPanel module={SLUG} locale={locale} dict={dict} className="mt-8" />

      <p className="meta mt-6">{def.monogram} · grounding/{SLUG}.json</p>
    </article>
  );
}
