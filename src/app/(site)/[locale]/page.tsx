import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Chat } from "@/components/Chat";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { routing } from "@/i18n/routing";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("Chat");

  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-4 px-4 py-3">
          <h1 className="text-lg font-semibold text-zinc-900">{t("title")}</h1>
          {/* Admin area is English-only and lives outside the locale routes. */}
          <Link href="/admin" className="ms-auto text-sm text-zinc-500 hover:text-zinc-900">
            {t("admin")}
          </Link>
          <LanguageSwitcher label={t("language")} />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6">
        <Chat />
      </main>
    </div>
  );
}
