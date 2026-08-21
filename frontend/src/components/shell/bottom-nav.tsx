"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { AccessibilityMenu } from "@/components/shell/accessibility-menu";
import { AccountPanel } from "@/components/shell/account-panel";
import { ModuleNav } from "@/components/shell/module-nav";
import { Sheet } from "@/components/shell/sheet";
import { LanguageSwitch } from "@/components/ui";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { cn } from "@/lib/cn";
import { localePath } from "@/lib/routes";

type SheetName = "modules" | "more";

const TAB =
  "flex flex-1 flex-col items-center justify-center gap-1 rounded-chip px-2 py-2 text-xs no-underline " +
  "transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "focus-visible:outline-accent min-h-[3.25rem]";

/**
 * Mobile navigation. Three tabs rather than eight: at 360px, eight targets
 * come out under the 44px minimum and their labels are unreadable, so the
 * modules live one tap away in a sheet that lists all of them.
 */
export function BottomNav({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [sheet, setSheet] = useState<SheetName | null>(null);
  const pathname = usePathname() ?? "";
  const segments = pathname.split("/").filter(Boolean);
  const onHome = segments.length <= 1;

  const close = () => setSheet(null);

  return (
    <>
      <nav
        aria-label={dict.app.primaryNav}
        className="sticky bottom-0 z-30 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="mx-auto flex max-w-lg items-stretch gap-1 px-2 py-1">
          <li className="flex flex-1">
            <Link
              href={localePath(locale)}
              aria-current={onHome ? "page" : undefined}
              className={cn(TAB, onHome ? "text-accent" : "text-ink-2 hover:text-ink")}
            >
              <span aria-hidden="true" className="meta text-current">
                ⌂
              </span>
              {dict.app.home}
            </Link>
          </li>

          <li className="flex flex-1">
            <button
              type="button"
              onClick={() => setSheet("modules")}
              aria-haspopup="dialog"
              aria-expanded={sheet === "modules"}
              className={cn(
                TAB,
                !onHome ? "text-accent" : "text-ink-2 hover:text-ink",
              )}
            >
              <span aria-hidden="true" className="meta text-current">
                ▦
              </span>
              {dict.app.modules}
            </button>
          </li>

          <li className="flex flex-1">
            <button
              type="button"
              onClick={() => setSheet("more")}
              aria-haspopup="dialog"
              aria-expanded={sheet === "more"}
              className={cn(TAB, "text-ink-2 hover:text-ink")}
            >
              <span aria-hidden="true" className="meta text-current">
                ⋯
              </span>
              {dict.app.more}
            </button>
          </li>
        </ul>
      </nav>

      <Sheet
        open={sheet === "modules"}
        onClose={close}
        title={dict.app.modules}
        closeLabel={dict.app.close}
      >
        <ModuleNav locale={locale} dict={dict} onNavigate={close} />
      </Sheet>

      <Sheet
        open={sheet === "more"}
        onClose={close}
        title={dict.app.settings}
        closeLabel={dict.app.close}
      >
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-3">
            <span className="label">{dict.app.languageLabel}</span>
            <LanguageSwitch locale={locale} label={dict.app.languageLabel} compact />
          </div>
          <AccessibilityMenu dict={dict} />
          <AccountPanel locale={locale} dict={dict} onNavigate={close} />
        </div>
      </Sheet>
    </>
  );
}
