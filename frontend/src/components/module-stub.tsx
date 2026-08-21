import { Button, Card, SectionHeader, StatusDot } from "@/components/ui";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { getModule, modules, type ModuleSlug } from "@/lib/modules";
import { localePath } from "@/lib/routes";

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
  const index = modules.findIndex((m) => m.slug === slug) + 1;

  return (
    <article className="mx-auto max-w-5xl px-5 py-12">
      <SectionHeader
        as="h1"
        index={index}
        eyebrow={def.flagship ? dict.status.flagship : def.monogram}
        title={copy.name}
        description={copy.description}
        action={<StatusDot tone="warn" label={dict.status.scaffold} />}
      />

      <Card tone="sunken" className="mt-8 max-w-2xl">
        <p className="label">{dict.status.scaffold}</p>
        <p className="mt-2 text-ink-2">{dict.status.scaffoldNote}</p>
      </Card>

      <p className="mt-8">
        <Button href={localePath(locale)}>{dict.app.backToHome}</Button>
      </p>
    </article>
  );
}
