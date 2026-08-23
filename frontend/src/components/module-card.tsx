import Link from "next/link";

import { Card } from "@/components/ui";
import {
  FarmersIcon,
  FishermenIcon,
  ArtisansIcon,
  VendorsIcon,
  ServicesIcon,
  AccessibilityIcon,
  EducationIcon,
  DisasterIcon,
} from "@/components/ui/icons";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { ModuleDef, ModuleSlug } from "@/lib/modules";
import { localePath } from "@/lib/routes";

function ModuleIcon({ slug }: { slug: ModuleSlug }) {
  switch (slug) {
    case "farmers":
      return <FarmersIcon />;
    case "fishermen":
      return <FishermenIcon />;
    case "artisans":
      return <ArtisansIcon />;
    case "vendors":
      return <VendorsIcon />;
    case "services":
      return <ServicesIcon />;
    case "accessibility":
      return <AccessibilityIcon />;
    case "education":
      return <EducationIcon />;
    case "disaster":
      return <DisasterIcon />;
  }
}

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
    <Card interactive className="relative flex h-full flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <p className="label">
          <span className="sr-only">{dict.home.communityLabel}: </span>
          {copy.community}
        </p>
        {def.flagship ? (
          <span className="label shrink-0 rounded-chip bg-accent px-2 py-1 text-accent-ink">
            {dict.status.flagship}
          </span>
        ) : null}
      </div>

      <div className="flex items-center gap-2 mt-1">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-chip border border-border bg-surface-2 text-ink-2">
          <ModuleIcon slug={def.slug} />
        </span>
        <h3 className="text-lg font-semibold tracking-tight text-ink">
          <Link
            href={localePath(locale, def.slug)}
            className="no-underline after:absolute after:inset-0 after:content-['']"
          >
            {copy.name}
          </Link>
        </h3>
      </div>

      <p className="text-ink-2">{copy.description}</p>

      <p className="mt-auto pt-2">
        {/* Monochrome: the accent on this screen is spent on the Flagship chip. */}
        <span
          aria-hidden="true"
          className="inline-flex items-center gap-[0.5ch] text-xs font-medium text-ink-2"
        >
          {dict.app.open}
          <span>→</span>
        </span>
      </p>
    </Card>
  );
}
