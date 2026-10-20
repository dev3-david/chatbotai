import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { QaForm } from "@/components/QaForm";
import { listDepartments } from "@/lib/departments";

export const dynamic = "force-dynamic";

export default async function NewQaPage({
  searchParams,
}: {
  searchParams: Promise<{ department?: string }>;
}) {
  const [{ department }, departments] = await Promise.all([searchParams, listDepartments()]);
  if (departments.length === 0) {
    const t = await getTranslations("Admin.errors");
    redirect(`/admin/departments?error=${encodeURIComponent(t("createDepartmentFirst"))}`);
  }

  const defaultDepartment = departments.some((d) => d.slug === department) ? department! : departments[0].slug;

  return <QaForm departments={departments} defaultDepartment={defaultDepartment} />;
}
