import Link from "next/link";

import { BottomNav } from "@/components/shell/bottom-nav";
import { Sidebar } from "@/components/shell/sidebar";
import { LanguageSwitch } from "@/components/ui";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { localePath } from "@/lib/routes";
import { Suspense, type ReactNode } from "react";

/**
 * Sidebar from lg up, bottom tabs below it. Both render on the server; only
 * the interactive parts inside them are client components.
 */
import { CommandPalette } from "@/components/shell/command-palette";
import { DemoTour } from "@/components/shell/demo-tour";

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

      <div className="hidden w-72 shrink-0 lg:block">
        <div className="sticky top-0 h-dvh">
          <Sidebar locale={locale} dict={dict} />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Lives inside the content column, not as a sibling of the sidebar.
            When it sat directly in the lg:flex-row shell it became a flex ROW
            item on desktop: a ~420px column of empty bar to the left of the
            sidebar, squeezing main from ~1312px down to 889px. */}
        <header className="sticky top-0 z-30 border-b border-border bg-surface">
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <Link
              href={localePath(locale)}
              className="flex items-baseline gap-2 no-underline lg:hidden"
            >
              <span className="text-lg font-semibold tracking-tight text-ink">
                {dict.app.name}
              </span>
            </Link>

            <div className="ml-auto flex items-center gap-3">
              <CommandPalette locale={locale} dict={dict} />
              <LanguageSwitch locale={locale} label={dict.app.languageLabel} compact />
            </div>
          </div>
        </header>

        <main id="main" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
        <BottomNav locale={locale} dict={dict} />
      </div>

      {/* Judging aid, not an end-user feature. */}
      {process.env.NODE_ENV === "development" ? (
        <Suspense fallback={null}>
          <DemoTour locale={locale} dict={dict} />
        </Suspense>
      ) : null}
    </div>
  );
}
