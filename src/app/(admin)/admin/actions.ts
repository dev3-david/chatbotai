"use server";

import { getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/auth";
import {
  createDepartment,
  deleteDepartment,
  listDepartments,
  renameDepartment,
} from "@/lib/departments";
import { createQa, deleteQa, normaliseQuestions, parseTags, updateQa } from "@/lib/qa";
import { MAX_QUESTION_VARIATIONS } from "@/lib/types";

export interface FormState {
  error: string | null;
}

type Errors = Awaited<ReturnType<typeof getTranslations<"Admin.errors">>>;

function qaSchema(t: Errors) {
  return z.object({
    id: z.string().optional(),
    department: z.string().min(1, t("pickDepartment")),
    questions: z
      .array(z.string().trim().min(3, t("questionShort")).max(500, t("questionLong")))
      .min(1, t("minOneQuestion"))
      .max(MAX_QUESTION_VARIATIONS, t("maxVariations", { max: MAX_QUESTION_VARIATIONS })),
    answer: z.string().trim().min(1, t("answerRequired")).max(5000, t("answerLong")),
    tags: z.string().optional(),
  });
}

export async function saveQaAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const [{ email }, t] = await Promise.all([requireAdmin(), getTranslations("Admin.errors")]);

  const parsed = qaSchema(t).safeParse({
    id: formData.get("id") || undefined,
    department: formData.get("department"),
    questions: normaliseQuestions(formData.getAll("questions").map(String)),
    answer: formData.get("answer") ?? "",
    tags: formData.get("tags") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? t("invalid") };
  }

  const departments = await listDepartments();
  if (!departments.some((d) => d.slug === parsed.data.department)) {
    return { error: t("unknownDepartment") };
  }

  const input = {
    department: parsed.data.department,
    questions: parsed.data.questions,
    answer: parsed.data.answer,
    tags: parseTags(parsed.data.tags ?? ""),
  };

  try {
    if (parsed.data.id) {
      const ok = await updateQa(parsed.data.id, input);
      if (!ok) return { error: t("gone") };
    } else {
      await createQa(input, email);
    }
  } catch (err) {
    console.error("[saveQa]", err);
    return { error: t("saveFailed") };
  }

  revalidatePath("/admin");
  redirect(`/admin?department=${encodeURIComponent(input.department)}`);
}

export async function deleteQaAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const department = String(formData.get("department") ?? "");
  await deleteQa(id);
  revalidatePath("/admin");
  redirect(`/admin?department=${encodeURIComponent(department)}`);
}

function departmentsWithError(message: string): never {
  redirect(`/admin/departments?error=${encodeURIComponent(message)}`);
}

export async function createDepartmentAction(formData: FormData): Promise<void> {
  const [, t] = await Promise.all([requireAdmin(), getTranslations("Admin.errors")]);
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) departmentsWithError(t("nameShort"));
  try {
    await createDepartment(name);
  } catch (err) {
    departmentsWithError((err as Error).message.includes("duplicate") ? t("duplicateDepartment") : t("saveFailed"));
  }
  revalidatePath("/admin");
  revalidatePath("/admin/departments");
  redirect("/admin/departments");
}

export async function renameDepartmentAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const slug = String(formData.get("slug") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (slug && name.length >= 2) await renameDepartment(slug, name);
  revalidatePath("/admin");
  revalidatePath("/admin/departments");
  redirect("/admin/departments");
}

export async function deleteDepartmentAction(formData: FormData): Promise<void> {
  const [, t] = await Promise.all([requireAdmin(), getTranslations("Admin.errors")]);
  const slug = String(formData.get("slug") ?? "");
  const result = await deleteDepartment(slug);
  if (!result.deleted) departmentsWithError(result.reason ? t("stillHasQuestions") : t("cannotDelete"));
  revalidatePath("/admin");
  revalidatePath("/admin/departments");
  redirect("/admin/departments");
}
