import Link from "next/link";

import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { localePath } from "@/lib/routes";

export function SiteFooter({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-5">
        <p className="meta">{dict.home.eyebrow}</p>
        <div className="flex items-center gap-4">
          {process.env.NODE_ENV === "development" ? (
            <Link
              href={localePath(locale, "styleguide")}
              className="meta text-ink-2 underline-offset-4 hover:text-ink"
            >
              Styleguide
            </Link>
          ) : null}
          <p className="meta">{dict.home.moduleCount}</p>
        </div>
      </div>
    </footer>
  );
}
