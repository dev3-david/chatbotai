import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { AdminLanguageSwitcher } from "@/components/AdminLanguageSwitcher";
import { loginAction } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ error }, t, tAdmin] = await Promise.all([
    searchParams,
    getTranslations("Admin.login"),
    getTranslations("Admin"),
  ]);

  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      {/* Same top bar as the chat and admin pages, so the language switcher is always in one place. */}
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="font-semibold text-zinc-900">
            {tAdmin("brand")}
          </Link>
          <AdminLanguageSwitcher label={tAdmin("language")} />
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <form action={loginAction} className="w-full max-w-sm space-y-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900">{t("title")}</h1>
            <p className="text-sm text-zinc-500">{t("intro")}</p>
          </div>
          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{t("invalid")}</p>}
          <label className="block text-sm">
            <span className="text-zinc-700">{t("email")}</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="username"
              dir="ltr"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
            />
          </label>
          <label className="block text-sm">
            <span className="text-zinc-700">{t("password")}</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              dir="ltr"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
            />
          </label>
          <button type="submit" className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
            {t("submit")}
          </button>
          <p className="text-center text-xs text-zinc-400">
            <Link href="/" className="hover:text-zinc-700">
              {t("back")}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
