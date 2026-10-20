"use server";

import { hasLocale } from "next-intl";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, routing } from "@/i18n/routing";

/** Remembers the UI language for the admin area and the chat pages alike. */
export async function setLocaleAction(locale: string): Promise<void> {
  if (!hasLocale(routing.locales, locale)) return;
  (await cookies()).set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: "lax",
  });
}
