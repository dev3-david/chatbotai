import { defineRouting } from "next-intl/routing";

/** Cookie that remembers the chosen UI language, shared by chat and admin. */
export const LOCALE_COOKIE = "NEXT_LOCALE";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // one year

export const routing = defineRouting({
  // UI languages. Content (questions and answers) is Hebrew and English only.
  locales: ["en", "he", "th", "vi"],
  defaultLocale: "en",
  // "/" is English, "/he", "/th", "/vi" for the others.
  localePrefix: "as-needed",
  // Switching language on the chat pages writes this cookie; the admin area reads it.
  localeCookie: { name: LOCALE_COOKIE, maxAge: LOCALE_COOKIE_MAX_AGE },
});

export type Locale = (typeof routing.locales)[number];

/** Languages that stored answers can be written in. */
export const CONTENT_LOCALES = ["en", "he"] as const;
export type ContentLocale = (typeof CONTENT_LOCALES)[number];

export const RTL_LOCALES: readonly string[] = ["he"];

export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  he: "עברית",
  th: "ไทย",
  vi: "Tiếng Việt",
};
