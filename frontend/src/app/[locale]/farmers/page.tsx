import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ChatPanel } from "@/components/chat-panel";
import { CropDiagnosis } from "@/components/modules/crop-diagnosis";
import { MandiPrices } from "@/components/modules/mandi-prices";
import { Reveal } from "@/components/reveal";
import { SectionHeader, StatusDot } from "@/components/ui";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getModule, modules } from "@/lib/modules";

const SLUG = "farmers" as const;

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
    <article className="mx-auto flex max-w-4xl flex-col gap-10 px-5 py-10 sm:py-12">
      <SectionHeader
        as="h1"
        index={index}
        eyebrow={copy.community}
        title={copy.name}
        description={copy.description}
        action={<StatusDot tone="ok" label={dict.status.flagship} />}
      />

      <Reveal>
        <CropDiagnosis locale={locale} dict={dict} />
      </Reveal>
      <Reveal delay={80}>
        <MandiPrices dict={dict} />
      </Reveal>
      <Reveal delay={160}>
        <ChatPanel module={SLUG} locale={locale} dict={dict} />
      </Reveal>

      <p className="meta">{def.monogram} · grounding/{SLUG}.json · models/crop_disease.onnx</p>
    </article>
  );
}
