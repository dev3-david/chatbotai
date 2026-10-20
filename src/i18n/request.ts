import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  // Chat pages: the locale comes from the URL segment via the proxy.
  // Admin and login pages have no locale segment, so fall back to the cookie
  // the language switcher writes.
  let candidate = await requestLocale;
  if (!candidate) candidate = (await cookies()).get(LOCALE_COOKIE)?.value;

  const locale = hasLocale(routing.locales, candidate) ? candidate : routing.defaultLocale;
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
