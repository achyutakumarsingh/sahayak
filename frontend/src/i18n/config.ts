export const locales = ["en", "hi"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  hi: "हिन्दी",
};

/** BCP-47 tag used for the <html lang> attribute. */
export const localeTags: Record<Locale, string> = {
  en: "en-IN",
  hi: "hi-IN",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
