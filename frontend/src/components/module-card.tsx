import Link from "next/link";

import { Button, Card } from "@/components/ui";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { ModuleDef } from "@/lib/modules";
import { localePath } from "@/lib/routes";

/**
 * Home-screen tile: who the module serves, the one line it does for them, and
 * the way in. The heading link is stretched over the whole card, so the
 * "Open" affordance is presentational — a second control there would be a
 * redundant tab stop reading the same destination.
 */
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
    <Card as="li" interactive className="relative flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <p className="label">
          <span className="sr-only">{dict.home.communityLabel}: </span>
          {copy.community}
        </p>
        {def.flagship ? (
          <span className="label shrink-0 text-accent">{dict.status.flagship}</span>
        ) : null}
      </div>

      <h3 className="text-lg font-semibold tracking-tight text-ink">
        <Link
          href={localePath(locale, def.slug)}
          className="no-underline after:absolute after:inset-0 after:content-['']"
        >
          {copy.name}
        </Link>
      </h3>

      <p className="text-ink-2">{copy.description}</p>

      <p className="mt-auto pt-2">
        <Button presentational size="sm">
          {dict.app.open}
        </Button>
      </p>
    </Card>
  );
}
