import { notFound } from "next/navigation";
import { QaForm } from "@/components/QaForm";
import { listDepartments } from "@/lib/departments";
import { getQa } from "@/lib/qa";

export const dynamic = "force-dynamic";

export default async function EditQaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [item, departments] = await Promise.all([getQa(id), listDepartments()]);
  if (!item) notFound();

  return <QaForm departments={departments} defaultDepartment={item.department} item={item} />;
}
