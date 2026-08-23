import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ChatPanel } from "@/components/chat-panel";
import { DistrictAlert } from "@/components/disaster/district-alert";
import { EmergencyChecklist } from "@/components/disaster/emergency-checklist";
import { Reveal } from "@/components/reveal";
import { Disclaimer, SectionHeader, StatusDot } from "@/components/ui";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getModule, modules } from "@/lib/modules";

const SLUG = "disaster" as const;

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
  const isHindi = locale === "hi";

  return (
    <article className="mx-auto flex max-w-4xl flex-col gap-8 px-5 py-10 sm:py-12">
      <SectionHeader
        as="h1"
        index={index}
        eyebrow={copy.community}
        title={copy.name}
        description={copy.description}
        action={<StatusDot tone="ok" label="Active" />}
      />

      <Disclaimer tone="sample" label={dict.chat.sampleDataLabel}>
        {dict.chat.sampleDataBody}
      </Disclaimer>

      <DistrictAlert dict={dict} isHindi={isHindi} />
      <EmergencyChecklist dict={dict} isHindi={isHindi} />

      <Reveal>
        <ChatPanel
          module={SLUG}
          locale={locale}
          dict={dict}
          disclaimer={null}
        />
      </Reveal>

      <p className="meta">
        {def.monogram} · grounding/{SLUG}.json
      </p>
    </article>
  );
}
