import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ModuleStub } from "@/components/module-stub";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

const SLUG = "vendors" as const;

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

  return <ModuleStub slug={SLUG} locale={locale} dict={dict} />;
}
