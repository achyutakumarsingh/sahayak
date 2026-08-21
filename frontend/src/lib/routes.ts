import type { Route } from "next";

import type { Locale } from "@/i18n/config";

/** Builds a locale-prefixed path, e.g. localePath("hi", "farmers") -> /hi/farmers */
export function localePath(locale: Locale | string, path = ""): Route {
  const suffix = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  return `/${locale}${suffix}` as Route;
}
