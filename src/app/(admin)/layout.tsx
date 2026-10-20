import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { RTL_LOCALES } from "@/i18n/routing";
import { fontClassName } from "@/lib/fonts";
import "@/app/globals.css";

// Root layout for the admin area and login page. The language follows the
// cookie written by either language switcher (chat or admin).
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin");
  return { title: t("brand") };
}

export default async function AdminRootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      dir={RTL_LOCALES.includes(locale) ? "rtl" : "ltr"}
      className={`${fontClassName} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
