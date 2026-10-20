import { getTranslations } from "next-intl/server";
import { createDepartmentAction, deleteDepartmentAction, renameDepartmentAction } from "../actions";
import { listDepartments } from "@/lib/departments";

export const dynamic = "force-dynamic";

export default async function DepartmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ error }, departments, t] = await Promise.all([
    searchParams,
    listDepartments(),
    getTranslations("Admin.departments"),
  ]);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900">{t("title")}</h1>
        <p className="text-sm text-zinc-500">{t("intro")}</p>
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <form action={createDepartmentAction} className="flex gap-2 rounded-xl border border-zinc-200 bg-white p-4">
        <input
          name="name"
          required
          minLength={2}
          placeholder={t("placeholder")}
          dir="auto"
          className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500"
        />
        <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
          {t("add")}
        </button>
      </form>

      <ul className="divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white">
        {departments.length === 0 && <li className="px-4 py-6 text-center text-sm text-zinc-500">{t("none")}</li>}
        {departments.map((d) => (
          <li key={d.slug} className="flex items-center gap-3 px-4 py-3 text-sm">
            <form action={renameDepartmentAction} className="flex flex-1 items-center gap-2">
              <input type="hidden" name="slug" value={d.slug} />
              <input
                name="name"
                defaultValue={d.name}
                required
                minLength={2}
                dir="auto"
                className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-zinc-900 outline-none focus:border-zinc-500"
              />
              <code className="text-xs text-zinc-400" dir="ltr">
                {d.slug}
              </code>
              <button type="submit" className="rounded-lg border border-zinc-300 px-3 py-1.5 hover:bg-zinc-100">
                {t("rename")}
              </button>
            </form>
            <form action={deleteDepartmentAction}>
              <input type="hidden" name="slug" value={d.slug} />
              <button type="submit" className="text-red-600 hover:underline">
                {t("delete")}
              </button>
            </form>
          </li>
        ))}
      </ul>
      <p className="text-xs text-zinc-400">{t("deleteHint")}</p>
    </div>
  );
}
