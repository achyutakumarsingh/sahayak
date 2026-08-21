import Link from "next/link";

import { LocaleSwitcher } from "@/components/locale-switcher";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

export function SiteHeader({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  return (
    <header className="border-b border-hairline">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4">
        <Link
          href={`/${locale}` as never}
          className="flex items-baseline gap-2 no-underline"
        >
          <span className="text-lg font-semibold tracking-tight text-fg">
            {dict.app.name}
          </span>
          <span className="label hidden sm:inline">Sahayak</span>
        </Link>
        <LocaleSwitcher current={locale} label={dict.app.languageLabel} />
      </div>
    </header>
  );
}
