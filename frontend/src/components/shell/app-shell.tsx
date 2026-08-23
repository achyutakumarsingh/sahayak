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
import { CommandPalette } from "@/components/shell/command-palette";

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

      <div className="hidden w-[260px] shrink-0 lg:block">
        <div className="sticky top-0 h-dvh">
          <Sidebar locale={locale} dict={dict} />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col relative">
        {/* Compact top bar — mobile and desktop search header */}
        <header className="sticky top-0 z-30 lg:absolute lg:top-0 lg:right-0 lg:w-full lg:bg-transparent border-b border-border lg:border-none bg-surface pointer-events-none">
          <div className="flex items-center justify-between gap-4 px-4 py-3 lg:px-8 lg:py-6">
            <Link href={localePath(locale)} className="flex items-baseline gap-2 no-underline lg:hidden pointer-events-auto">
              <span className="text-lg font-semibold tracking-tight text-ink">
                {dict.app.name}
              </span>
            </Link>

            <div className="flex items-center gap-3 ml-auto pointer-events-auto">
              <CommandPalette locale={locale} dict={dict} />
              <div className="lg:hidden">
                <LanguageSwitch locale={locale} label={dict.app.languageLabel} compact />
              </div>
            </div>
          </div>
        </header>

        <main id="main" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
        <BottomNav locale={locale} dict={dict} />
      </div>
    </div>
  );
}
