import Link from "next/link";

import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { getModule, type ModuleSlug } from "@/lib/modules";

/**
 * Shared placeholder body for the eight module routes. Each route keeps its own
 * metadata and passes its slug in; the copy comes from the locale dictionary.
 */
export function ModuleStub({
  slug,
  locale,
  dict,
}: {
  slug: ModuleSlug;
  locale: Locale;
  dict: Dictionary;
}) {
  const def = getModule(slug);
  const copy = dict.modules[slug];

  return (
    <article className="mx-auto max-w-5xl px-5 py-12">
      <p className="label">
        {def.monogram}
        {def.flagship ? ` · ${dict.status.flagship}` : ""}
      </p>

      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-fg">
        {copy.name}
      </h1>

      <p className="mt-3 max-w-2xl text-lg text-muted">{copy.description}</p>

      <div className="card mt-8 max-w-2xl p-5">
        <p className="label">{dict.status.scaffold}</p>
        <p className="mt-2 text-muted">{dict.status.scaffoldNote}</p>
      </div>

      <p className="mt-8">
        <Link href={`/${locale}` as never} className="cta">
          {dict.app.backToHome}
        </Link>
      </p>
    </article>
  );
}
