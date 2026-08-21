import Link from "next/link";

import { LanguageSwitch } from "@/components/ui";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { localePath } from "@/lib/routes";

export function SiteHeader({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4">
        <Link
          href={localePath(locale)}
          className="flex items-baseline gap-2 no-underline"
        >
          <span className="text-lg font-semibold tracking-tight text-ink">
            {dict.app.name}
          </span>
          <span className="label hidden sm:inline">Sahayak</span>
        </Link>
        <LanguageSwitch locale={locale} label={dict.app.languageLabel} />
      </div>
    </header>
  );
}
