"use client";

import Link from "next/link";

import { AccessibilityMenu } from "@/components/shell/accessibility-menu";
import { AccountPanel } from "@/components/shell/account-panel";
import { ModuleNav } from "@/components/shell/module-nav";
import { LanguageSwitch } from "@/components/ui";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { localePath } from "@/lib/routes";

/** Desktop navigation: all eight modules, language, accessibility, account. */
export function Sidebar({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto border-r border-border bg-surface px-4 py-5">
      <Link
        href={localePath(locale)}
        className="flex items-baseline gap-2 px-3 no-underline"
      >
        <span className="text-lg font-semibold tracking-tight text-ink">
          {dict.app.name}
        </span>
        <span className="label">Sahayak</span>
      </Link>

      <nav aria-label={dict.app.moduleNav}>
        <h2 className="label px-3 pb-2">{dict.app.modules}</h2>
        <ModuleNav locale={locale} dict={dict} />
      </nav>

      <div className="mt-auto flex flex-col gap-5 border-t border-border px-3 pt-5">
        <div className="flex items-center justify-between gap-3">
          <span className="label">{dict.app.languageLabel}</span>
          <LanguageSwitch locale={locale} label={dict.app.languageLabel} compact />
        </div>
        <AccessibilityMenu dict={dict} />
        <AccountPanel locale={locale} dict={dict} />
      </div>
    </div>
  );
}
