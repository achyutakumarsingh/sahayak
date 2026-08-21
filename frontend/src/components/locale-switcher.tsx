"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { localeNames, locales, type Locale } from "@/i18n/config";

/**
 * Swaps the leading /<locale> segment of the current path, so switching
 * language keeps the reader on the same screen.
 */
export function LocaleSwitcher({
  current,
  label,
}: {
  current: Locale;
  label: string;
}) {
  const pathname = usePathname() ?? "/";
  const rest = pathname.split("/").slice(2).join("/");

  return (
    <nav aria-label={label} className="flex items-center gap-2">
      <span className="label" aria-hidden="true">
        {label}
      </span>
      <ul className="flex items-center gap-1">
        {locales.map((locale) => {
          const isCurrent = locale === current;
          const href = `/${locale}${rest ? `/${rest}` : ""}`;
          return (
            <li key={locale}>
              <Link
                href={href as never}
                hrefLang={locale}
                lang={locale}
                aria-current={isCurrent ? "true" : undefined}
                className={[
                  "block border px-2 py-1 text-xs transition-colors",
                  isCurrent
                    ? "border-hairline-strong bg-sunken text-fg"
                    : "border-transparent text-muted hover:border-hairline hover:text-fg",
                ].join(" ")}
              >
                {localeNames[locale]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
