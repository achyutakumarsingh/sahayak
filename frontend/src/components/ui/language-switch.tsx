"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";

import { isLocale, localeNames, locales, type Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";

export type LanguageSwitchProps = {
  /** Defaults to the locale in the current path. */
  locale?: Locale;
  label: string;
  /** Hide the visible label; it stays on the group for screen readers. */
  compact?: boolean;
  className?: string;
};

/**
 * en/hi toggle. Renders real links that swap the leading /<locale> segment,
 * so it keeps the reader on the same screen and works without JavaScript.
 * The proxy persists the choice to a cookie on navigation.
 */
export function LanguageSwitch({
  locale,
  label,
  compact = false,
  className,
}: LanguageSwitchProps) {
  const pathname = usePathname() ?? "/";
  const segments = pathname.split("/").filter(Boolean);
  const fromPath = segments[0];
  const current: Locale =
    locale ?? (fromPath && isLocale(fromPath) ? fromPath : locales[0]);
  const rest = segments.slice(1).join("/");

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {compact ? null : (
        <span className="label" aria-hidden="true">
          {label}
        </span>
      )}
      <div
        role="group"
        aria-label={label}
        className="flex items-center rounded-chip border border-border p-0.5"
      >
        {locales.map((option) => {
          const isCurrent = option === current;
          return (
            <Link
              key={option}
              href={`/${option}${rest ? `/${rest}` : ""}` as Route}
              hrefLang={option}
              lang={option}
              aria-current={isCurrent ? "true" : undefined}
              className={cn(
                "rounded-chip px-2.5 py-1 font-mono text-xs no-underline transition-colors duration-150",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                isCurrent
                  ? "bg-accent text-accent-ink"
                  : "text-ink-2 hover:text-ink",
              )}
            >
              {option === "en" ? "EN" : "हि"}
              <span className="sr-only"> — {localeNames[option]}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
