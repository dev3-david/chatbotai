import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { deleteQaAction } from "./actions";
import { listDepartments } from "@/lib/departments";
import { listQa } from "@/lib/qa";

export const dynamic = "force-dynamic";

interface Search {
  department?: string;
  q?: string;
  page?: string;
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<Search> }) {
  const [params, departments, t, locale] = await Promise.all([
    searchParams,
    listDepartments(),
    getTranslations("Admin"),
    getLocale(),
  ]);

  if (departments.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center">
        <p className="text-zinc-700">{t("noDepartments.title")}</p>
        <Link href="/admin/departments" className="mt-3 inline-block text-sm font-semibold text-blue-600">
          {t("noDepartments.cta")}
        </Link>
      </div>
    );
  }

  const current = departments.find((d) => d.slug === params.department) ?? departments[0];
  const q = params.q ?? "";
  const page = Number(params.page ?? "1") || 1;
  const result = await listQa(current.slug, q, page);
  const pageCount = Math.max(1, Math.ceil(result.total / result.pageSize));

  const href = (overrides: Partial<Search>) => {
    const sp = new URLSearchParams();
    sp.set("department", overrides.department ?? current.slug);
    const qq = overrides.q ?? q;
    if (qq) sp.set("q", qq);
    const pg = overrides.page ?? "1";
    if (pg !== "1") sp.set("page", pg);
    return `/admin?${sp.toString()}`;
  };

  return (
    <div className="space-y-4">
      {/* Department tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {departments.map((d) => (
          <Link
            key={d.slug}
            href={href({ department: d.slug, q: "", page: "1" })}
            className={
              d.slug === current.slug
                ? "rounded-lg border border-blue-600 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700"
                : "rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100"
            }
          >
            {d.name}
          </Link>
        ))}
        <Link
          href="/admin/departments"
          className="rounded-lg border border-dashed border-zinc-300 px-3 py-1.5 text-sm text-zinc-500 hover:bg-zinc-100"
        >
          {t("tabs.addDepartment")}
        </Link>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <form action="/admin" method="get" className="flex gap-2">
          <input type="hidden" name="department" value={current.slug} />
          <input
            name="q"
            defaultValue={q}
            placeholder={t("search.placeholder")}
            dir="auto"
            className="w-72 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 outline-none focus:border-zinc-500"
          />
          <button type="submit" className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm hover:bg-zinc-100">
            {t("search.button")}
          </button>
        </form>
        <Link
          href={`/admin/qa/new?department=${encodeURIComponent(current.slug)}`}
          className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white"
        >
          {t("addEntry")}
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-start text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-2 text-start">{t("table.question")}</th>
              <th className="px-4 py-2 text-start">{t("table.tags")}</th>
              <th className="px-4 py-2 text-start">{t("table.updated")}</th>
              <th className="px-4 py-2 text-end">{t("table.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {result.items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                  {q ? t("table.noMatch") : t("table.noEntries", { department: current.name })}
                </td>
              </tr>
            )}
            {result.items.map((item) => {
              const [primary, ...more] = item.questions;
              return (
                <tr key={item.id} className="align-top hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/qa/${item.id}`} className="font-medium text-zinc-900 hover:underline" dir="auto">
                      {primary}
                    </Link>
                    {more.length > 0 && (
                      <span
                        className="ms-2 rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-600"
                        title={more.join("\n")}
                      >
                        {t("table.variations", { count: more.length })}
                      </span>
                    )}
                    <p className="mt-1 line-clamp-2 text-xs text-zinc-500" dir="auto">
                      {item.answer}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{item.tags.join(", ")}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-zinc-600">
                    {new Date(item.updatedAt).toLocaleDateString(locale)}
                  </td>
                  <td className="px-4 py-3 text-end whitespace-nowrap">
                    <Link href={`/admin/qa/${item.id}`} className="text-blue-600 hover:underline">
                      {t("table.edit")}
                    </Link>
                    <form action={deleteQaAction} className="ms-3 inline">
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="department" value={current.slug} />
                      <button type="submit" className="text-red-600 hover:underline">
                        {t("table.delete")}
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pager */}
      <div className="flex items-center justify-between text-sm text-zinc-500">
        <span>{t("table.count", { count: result.total, department: current.name })}</span>
        {pageCount > 1 && (
          <span className="flex items-center gap-3">
            {page > 1 ? <Link href={href({ page: String(page - 1) })}>{t("pager.previous")}</Link> : <span />}
            <span>{t("pager.page", { page, total: pageCount })}</span>
            {page < pageCount ? <Link href={href({ page: String(page + 1) })}>{t("pager.next")}</Link> : <span />}
          </span>
        )}
      </div>
    </div>
  );
}
