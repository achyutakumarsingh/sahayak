import Link from "next/link";

import { BottomNav } from "@/components/shell/bottom-nav";
import { Sidebar } from "@/components/shell/sidebar";
import { LanguageSwitch } from "@/components/ui";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { localePath } from "@/lib/routes";
import type { ReactNode } from "react";

/**
 * Sidebar from lg up, bottom tabs below it. Both render on the server; only
 * the interactive parts inside them are client components.
 */
export function AppShell({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      <a href="#main" className="skip-link">
        {dict.app.skipToContent}
      </a>

      {/* Compact top bar — mobile only; the sidebar covers this on desktop. */}
      <header className="sticky top-0 z-30 border-b border-border bg-surface lg:hidden">
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <Link href={localePath(locale)} className="flex items-baseline gap-2 no-underline">
            <span className="text-lg font-semibold tracking-tight text-ink">
              {dict.app.name}
            </span>
          </Link>
          <LanguageSwitch locale={locale} label={dict.app.languageLabel} compact />
        </div>
      </header>

      <div className="hidden w-72 shrink-0 lg:block">
        <div className="sticky top-0 h-dvh">
          <Sidebar locale={locale} dict={dict} />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <main id="main" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
        <BottomNav locale={locale} dict={dict} />
      </div>
    </div>
  );
}
