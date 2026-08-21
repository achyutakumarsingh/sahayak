import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SectionHeader } from "@/components/ui";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

import { SignInForm } from "./sign-in-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return { title: dict.auth.signIn, description: dict.auth.intro };
}

export default async function SignInPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <SectionHeader
        as="h1"
        eyebrow={dict.auth.account}
        title={dict.auth.title}
        description={dict.auth.intro}
        className="mb-8"
      />
      <SignInForm locale={locale} dict={dict} />
    </div>
  );
}
