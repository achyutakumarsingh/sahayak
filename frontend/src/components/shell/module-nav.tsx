"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { cn } from "@/lib/cn";
import { modules } from "@/lib/modules";
import { localePath } from "@/lib/routes";

/** The module slug in the current path, or null on the home screen. */
function useActiveSlug(): string | null {
  const pathname = usePathname() ?? "";
  return pathname.split("/").filter(Boolean)[1] ?? null;
}

export function ModuleNav({
  locale,
  dict,
  onNavigate,
  className,
}: {
  locale: Locale;
  dict: Dictionary;
  /** Called after a link is followed — lets the mobile sheet close itself. */
  onNavigate?: () => void;
  className?: string;
}) {
  const active = useActiveSlug();

  return (
    <ul className={cn("flex flex-col gap-0.5", className)}>
      {modules.map((module) => {
        const copy = dict.modules[module.slug];
        const isActive = active === module.slug;

        return (
          <li key={module.slug}>
            <Link
              href={localePath(locale, module.slug)}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-chip px-3 py-2 no-underline transition-colors duration-150",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                isActive
                  ? "bg-surface-2 text-ink"
                  : "text-ink-2 hover:bg-surface-2 hover:text-ink",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "meta w-6 shrink-0",
                  isActive ? "text-accent" : "text-subtle",
                )}
              >
                {module.monogram}
              </span>
              <span className="min-w-0 truncate">{copy.name}</span>
              {module.flagship ? (
                <span className="label ml-auto shrink-0">
                  {dict.status.flagship}
                </span>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
