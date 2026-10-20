import { getTranslations } from "next-intl/server";
import Link from "next/link";
import type { ReactNode } from "react";
import { auth } from "@/auth";
import { signOutAction } from "@/app/(admin)/login/actions";
import { AdminLanguageSwitcher } from "@/components/AdminLanguageSwitcher";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const [session, t] = await Promise.all([auth(), getTranslations("Admin")]);

  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <nav className="flex items-center gap-5 text-sm">
            <span className="font-semibold text-zinc-900">{t("brand")}</span>
            <Link href="/admin" className="text-zinc-600 hover:text-zinc-900">
              {t("nav.questions")}
            </Link>
            <Link href="/admin/departments" className="text-zinc-600 hover:text-zinc-900">
              {t("nav.departments")}
            </Link>
            <Link href="/" className="text-zinc-600 hover:text-zinc-900">
              {t("nav.chat")}
            </Link>
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <AdminLanguageSwitcher label={t("language")} />
            <form action={signOutAction} className="flex items-center gap-3">
              <span className="text-zinc-500">{session?.user?.email}</span>
              <button type="submit" className="rounded-md border border-zinc-300 px-3 py-1 text-zinc-700 hover:bg-zinc-100">
                {t("nav.signOut")}
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
