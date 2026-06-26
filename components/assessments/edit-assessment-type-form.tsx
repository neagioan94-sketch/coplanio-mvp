"use client";

import { useActionState } from "react";
import { updateAssessmentTypeAction } from "@/lib/assessments/actions";
import type { AssessmentTypeRow } from "@/lib/assessments/get-assessments";

interface EditAssessmentTypeFormProps {
  assessmentType: AssessmentTypeRow;
  organizationId: string;
}

const INPUT_CLASS =
  "rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50";

const LABEL_CLASS = "text-sm font-medium text-zinc-700 dark:text-zinc-300";

function higherIsBetterValue(v: boolean | null): string {
  if (v === true) return "true";
  if (v === false) return "false";
  return "";
}

export default function EditAssessmentTypeForm({
  assessmentType,
  organizationId,
}: EditAssessmentTypeFormProps) {
  const [state, action, isPending] = useActionState(updateAssessmentTypeAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="assessmentTypeId" value={assessmentType.id} />

      {state?.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-400">
          Assessment type updated.
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className={LABEL_CLASS}>
          Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={assessmentType.name}
          className={INPUT_CLASS}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="category" className={LABEL_CLASS}>
            Category
          </label>
          <input
            id="category"
            name="category"
            type="text"
            defaultValue={assessmentType.category ?? ""}
            placeholder="e.g. Speed, Strength"
            className={INPUT_CLASS}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="unit" className={LABEL_CLASS}>
            Unit
          </label>
          <input
            id="unit"
            name="unit"
            type="text"
            defaultValue={assessmentType.unit ?? ""}
            placeholder="e.g. seconds, cm, kg"
            className={INPUT_CLASS}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="higher_is_better" className={LABEL_CLASS}>
          Direction
        </label>
        <select
          id="higher_is_better"
          name="higher_is_better"
          defaultValue={higherIsBetterValue(assessmentType.higherIsBetter)}
          className={INPUT_CLASS}
        >
          <option value="">—</option>
          <option value="true">↑ Higher is better</option>
          <option value="false">↓ Lower is better</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className={LABEL_CLASS}>
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          defaultValue={assessmentType.description ?? ""}
          placeholder="Optional description or protocol notes…"
          className={INPUT_CLASS}
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {isPending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
