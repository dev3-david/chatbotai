"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { LOCALE_NAMES, routing, type Locale } from "@/i18n/routing";

export function LanguageSwitcher({ label }: { label: string }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <select
      aria-label={label}
      // Always LTR so the dropdown arrow stays on the right in RTL languages too.
      dir="ltr"
      value={locale}
      onChange={(e) => router.replace(pathname, { locale: e.target.value as Locale })}
      // Pinned to the physical right edge of the top bar in every language: last item
      // in LTR, first item in RTL (where the first flex item renders rightmost).
      className="order-last rtl:order-first rounded-lg border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900"
    >
      {routing.locales.map((l) => (
        <option key={l} value={l}>
          {LOCALE_NAMES[l]}
        </option>
      ))}
    </select>
  );
}
