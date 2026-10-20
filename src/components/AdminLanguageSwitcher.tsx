"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLocaleAction } from "@/app/(admin)/locale-actions";
import { LOCALE_NAMES, routing } from "@/i18n/routing";

/** Language switcher for pages outside the locale routes (admin, login). Writes the cookie and re-renders. */
export function AdminLanguageSwitcher({ label }: { label: string }) {
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <select
      aria-label={label}
      // Always LTR so the dropdown arrow stays on the right in RTL languages too.
      dir="ltr"
      value={locale}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value;
        startTransition(async () => {
          await setLocaleAction(next);
          router.refresh();
        });
      }}
      // Pinned to the physical right edge of the top bar (see LanguageSwitcher).
      className="order-last rtl:order-first rounded-lg border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 disabled:opacity-60"
    >
      {routing.locales.map((l) => (
        <option key={l} value={l}>
          {LOCALE_NAMES[l]}
        </option>
      ))}
    </select>
  );
}
