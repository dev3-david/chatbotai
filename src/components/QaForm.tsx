"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useActionState, useState } from "react";
import { saveQaAction, type FormState } from "@/app/(admin)/admin/actions";
import type { Department } from "@/lib/departments";
import { MAX_QUESTION_VARIATIONS, type QaItem } from "@/lib/types";

interface Props {
  departments: Department[];
  defaultDepartment: string;
  item?: QaItem;
}

const initial: FormState = { error: null };

const fieldClass =
  "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-zinc-500";

interface Variation {
  key: number;
  text: string;
}

export function QaForm({ departments, defaultDepartment, item }: Props) {
  const t = useTranslations("Admin.form");
  const [state, formAction, pending] = useActionState(saveQaAction, initial);
  const [variations, setVariations] = useState<Variation[]>(() => {
    const initialQuestions = item?.questions.length ? item.questions : [""];
    return initialQuestions.map((text, i) => ({ key: i, text }));
  });
  const [nextKey, setNextKey] = useState(variations.length);

  const addVariation = () => {
    if (variations.length >= MAX_QUESTION_VARIATIONS) return;
    setVariations((v) => [...v, { key: nextKey, text: "" }]);
    setNextKey((k) => k + 1);
  };
  const removeVariation = (key: number) => setVariations((v) => (v.length > 1 ? v.filter((x) => x.key !== key) : v));
  const updateVariation = (key: number, text: string) =>
    setVariations((v) => v.map((x) => (x.key === key ? { ...x, text } : x)));

  return (
    <form action={formAction} className="max-w-2xl space-y-5 rounded-xl border border-zinc-200 bg-white p-6">
      <h1 className="text-lg font-semibold text-zinc-900">{item ? t("editTitle") : t("addTitle")}</h1>
      {item && <input type="hidden" name="id" value={item.id} />}

      {state.error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}

      <label className="block text-sm">
        <span className="text-zinc-700">{t("department")}</span>
        <select name="department" defaultValue={item?.department ?? defaultDepartment} className={fieldClass}>
          {departments.map((d) => (
            <option key={d.slug} value={d.slug}>
              {d.name}
            </option>
          ))}
        </select>
      </label>

      {/* Question variations */}
      <fieldset className="space-y-2">
        <legend className="text-sm text-zinc-700">
          {t("questions")} <span className="text-zinc-400">· {t("questionsHint")}</span>
        </legend>
        {variations.map((v, i) => (
          <div key={v.key} className="flex items-center gap-2">
            <input
              name="questions"
              value={v.text}
              onChange={(e) => updateVariation(v.key, e.target.value)}
              required={i === 0}
              minLength={3}
              maxLength={500}
              dir="auto"
              placeholder={i === 0 ? t("questionPlaceholder") : t("variationPlaceholder")}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-zinc-500"
            />
            <button
              type="button"
              onClick={() => removeVariation(v.key)}
              disabled={variations.length === 1}
              aria-label={t("remove")}
              title={t("remove")}
              className="rounded-lg border border-zinc-300 px-2.5 py-2 text-sm text-zinc-500 hover:bg-zinc-100 disabled:opacity-30"
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addVariation}
          disabled={variations.length >= MAX_QUESTION_VARIATIONS}
          className="rounded-lg border border-dashed border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 disabled:opacity-40"
        >
          {t("addVariation")}
        </button>
        <p className="text-xs text-zinc-400">{t("variationsHint", { max: MAX_QUESTION_VARIATIONS })}</p>
      </fieldset>

      <label className="block text-sm">
        <span className="text-zinc-700">{t("answer")}</span>
        <textarea
          name="answer"
          defaultValue={item?.answer ?? ""}
          required
          rows={7}
          maxLength={5000}
          dir="auto"
          className={fieldClass}
        />
        <span className="text-xs text-zinc-400">{t("answerHint")}</span>
      </label>

      <label className="block text-sm">
        <span className="text-zinc-700">{t("tags")}</span>
        <input
          name="tags"
          defaultValue={item?.tags.join(", ") ?? ""}
          placeholder={t("tagsPlaceholder")}
          dir="auto"
          className={fieldClass}
        />
        <span className="text-xs text-zinc-400">{t("tagsHint")}</span>
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending ? t("saving") : t("save")}
        </button>
        <Link
          href={`/admin?department=${encodeURIComponent(item?.department ?? defaultDepartment)}`}
          className="text-sm text-zinc-500 hover:text-zinc-900"
        >
          {t("cancel")}
        </Link>
      </div>
    </form>
  );
}
