import type { Dictionary } from "@/i18n/get-dictionary";

export type ModuleSlug = keyof Dictionary["modules"];

export type ModuleDef = {
  slug: ModuleSlug;
  /** Two-letter mono monogram used in the module card. */
  monogram: string;
  flagship?: boolean;
};

/** Display order on the home grid. Farmers leads — it is the flagship module. */
export const modules: ModuleDef[] = [
  { slug: "farmers", monogram: "FA", flagship: true },
  { slug: "fishermen", monogram: "FI" },
  { slug: "artisans", monogram: "AR" },
  { slug: "vendors", monogram: "VE" },
  { slug: "services", monogram: "SE" },
  { slug: "accessibility", monogram: "AC" },
  { slug: "education", monogram: "ED" },
  { slug: "disaster", monogram: "DI" },
];

export function getModule(slug: ModuleSlug): ModuleDef {
  const found = modules.find((m) => m.slug === slug);
  if (!found) throw new Error(`Unknown module: ${slug}`);
  return found;
}
