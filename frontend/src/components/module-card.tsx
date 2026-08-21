import Link from "next/link";

import { Card } from "@/components/ui";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { ModuleDef } from "@/lib/modules";
import { localePath } from "@/lib/routes";

export function ModuleCard({
  module: def,
  locale,
  dict,
}: {
  module: ModuleDef;
  locale: Locale;
  dict: Dictionary;
}) {
  const copy = dict.modules[def.slug];

  return (
    <Card as="li" interactive className="relative flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="label" aria-hidden="true">
          {def.monogram}
        </span>
        {def.flagship ? (
          <span className="label text-accent">{dict.status.flagship}</span>
        ) : null}
      </div>

      <h3 className="text-lg font-semibold tracking-tight text-ink">
        {/* Stretched link: the whole card is the hit target, but only the
            title is announced as the link. */}
        <Link
          href={localePath(locale, def.slug)}
          className="no-underline after:absolute after:inset-0 after:content-['']"
        >
          {copy.name}
        </Link>
      </h3>

      <p className="text-ink-2">{copy.description}</p>

      <span
        aria-hidden="true"
        className="mt-auto inline-flex items-center gap-[0.5ch] pt-1 text-xs font-medium text-accent"
      >
        {dict.app.open}
        <span>→</span>
      </span>
    </Card>
  );
}
