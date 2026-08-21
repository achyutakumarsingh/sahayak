import Link from "next/link";

import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { ModuleDef } from "@/lib/modules";

export function ModuleCard({
  module,
  locale,
  dict,
}: {
  module: ModuleDef;
  locale: Locale;
  dict: Dictionary;
}) {
  const copy = dict.modules[module.slug];

  return (
    <li className="card relative flex flex-col gap-3 p-5 transition-colors hover:border-hairline-strong">
      <div className="flex items-center justify-between gap-3">
        <span className="label" aria-hidden="true">
          {module.monogram}
        </span>
        {module.flagship ? (
          <span className="label text-accent">{dict.status.flagship}</span>
        ) : null}
      </div>

      <h3 className="text-lg font-semibold tracking-tight text-fg">
        <Link
          href={`/${locale}/${module.slug}` as never}
          className="no-underline after:absolute after:inset-0 after:content-['']"
        >
          {copy.name}
        </Link>
      </h3>

      <p className="text-muted">{copy.description}</p>

      <span className="cta mt-1 text-xs" aria-hidden="true">
        {dict.app.open}
      </span>
    </li>
  );
}
