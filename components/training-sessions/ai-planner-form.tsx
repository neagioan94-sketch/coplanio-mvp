"use client";

import { useState } from "react";
import { useActionState } from "react";
import {
  generateTrainingPlanAction,
  confirmTrainingPlanAction,
} from "@/lib/training-sessions/ai-planner-actions";
import type { LlmDraft } from "@/schemas/ai-training-planner";
import type { TeamRow } from "@/lib/teams/get-teams";
import type { ExerciseRow } from "@/lib/exercises/get-exercises";

interface AiPlannerFormProps {
  organizationId: string;
  teams: TeamRow[];
  exercises: ExerciseRow[];
}

interface DraftItem {
  exerciseId: string;
  section: "warmup" | "main" | "cooldown";
  plannedDurationMinutes: number;
  rationale: string;
  notes: string;
  included: boolean;
}

const SECTION_LABELS: Record<DraftItem["section"], string> = {
  warmup: "Warm-up",
  main: "Main part",
  cooldown: "Cooldown",
};

const inputClass =
  "rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50";
const labelClass = "text-sm font-medium text-zinc-700 dark:text-zinc-300";

function flattenDraft(draft: LlmDraft): DraftItem[] {
  return draft.sections.flatMap((section) =>
    section.items.map((item) => ({
      exerciseId: item.exercise_id,
      section: section.section,
      plannedDurationMinutes: item.planned_duration_minutes,
      rationale: item.rationale,
      notes: "",
      included: true,
    })),
  );
}

export default function AiPlannerForm({ organizationId, teams, exercises }: AiPlannerFormProps) {
  const [view, setView] = useState<"input" | "review">("input");
  const [teamId, setTeamId] = useState("");

  const [generateState, generateAction, isGenerating] = useActionState(
    generateTrainingPlanAction,
    undefined,
  );
  const [confirmState, confirmAction, isConfirming] = useActionState(
    confirmTrainingPlanAction,
    undefined,
  );

  const [title, setTitle] = useState("");
  const [objective, setObjective] = useState("");
  const [durationMinutes, setDurationMinutes] = useState<number | "">("");
  const [items, setItems] = useState<DraftItem[]>([]);

  // Adjust state during render when a new successful draft arrives, instead of
  // syncing via an effect (see https://react.dev/learn/you-might-not-need-an-effect).
  const [seededDraft, setSeededDraft] = useState<LlmDraft | null>(null);
  const currentDraft =
    generateState && "success" in generateState && generateState.success
      ? generateState.draft
      : null;

  if (currentDraft && currentDraft !== seededDraft) {
    setSeededDraft(currentDraft);
    setTitle(currentDraft.title);
    setObjective(currentDraft.objective);
    setDurationMinutes(currentDraft.suggested_duration_minutes);
    setItems(flattenDraft(currentDraft));
    if (generateState && "teamId" in generateState) setTeamId(generateState.teamId);
    setView("review");
  }

  const exerciseById = new Map(exercises.map((e) => [e.id, e]));

  function updateItem(index: number, patch: Partial<DraftItem>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  const includedItems = items.filter((i) => i.included);
  const draftJson = JSON.stringify(
    includedItems.map((i) => ({
      exercise_id: i.exerciseId,
      section: i.section,
      planned_duration_minutes: i.plannedDurationMinutes,
      notes: i.notes || undefined,
    })),
  );

  if (view === "input") {
    return (
      <form action={generateAction} className="flex flex-col gap-5">
        <input type="hidden" name="organizationId" value={organizationId} />

        {generateState && "error" in generateState && generateState.error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
            {generateState.error}
          </p>
        )}

        {exercises.length === 0 && (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            Your organization has no exercises yet. Add exercises to your library before
            generating an AI plan.
          </p>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="team_id" className={labelClass}>
            Team <span className="text-red-500">*</span>
          </label>
          <select id="team_id" name="team_id" required className={inputClass}>
            <option value="">Select a team…</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="focus" className={labelClass}>
            Session focus <span className="text-red-500">*</span>
          </label>
          <textarea
            id="focus"
            name="focus"
            rows={3}
            required
            maxLength={500}
            placeholder="e.g. possession-based warm-up with a finishing-focused main phase"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="target_duration_minutes" className={labelClass}>
              Target duration (min)
            </label>
            <input
              id="target_duration_minutes"
              name="target_duration_minutes"
              type="number"
              min={1}
              placeholder="e.g. 90"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="max_exercise_count" className={labelClass}>
              Max exercises
            </label>
            <input
              id="max_exercise_count"
              name="max_exercise_count"
              type="number"
              min={1}
              max={15}
              placeholder="e.g. 8"
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isGenerating || exercises.length === 0}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {isGenerating ? "Generating…" : "Generate draft"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form action={confirmAction} className="flex flex-col gap-5">
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="team_id" value={teamId} />
      <input type="hidden" name="draftJson" value={draftJson} />

      {confirmState?.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
          {confirmState.error}
        </p>
      )}

      <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Draft — review and edit before saving
      </p>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="title" className={labelClass}>
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="session_date" className={labelClass}>
            Date <span className="text-red-500">*</span>
          </label>
          <input id="session_date" name="session_date" type="date" required className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="start_time" className={labelClass}>
            Start time
          </label>
          <input id="start_time" name="start_time" type="time" className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="duration_minutes" className={labelClass}>
            Duration (min)
          </label>
          <input
            id="duration_minutes"
            name="duration_minutes"
            type="number"
            min={1}
            value={durationMinutes}
            onChange={(e) =>
              setDurationMinutes(e.target.value ? Number(e.target.value) : "")
            }
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="location" className={labelClass}>
            Location
          </label>
          <input id="location" name="location" type="text" className={inputClass} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="objective" className={labelClass}>
          Objective
        </label>
        <textarea
          id="objective"
          name="objective"
          rows={2}
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className={labelClass}>
          Notes
        </label>
        <textarea id="notes" name="notes" rows={2} className={inputClass} />
      </div>

      <div className="flex flex-col gap-3">
        <p className={labelClass}>Exercise plan</p>
        {(["warmup", "main", "cooldown"] as const).map((section) => {
          const sectionItems = items
            .map((item, index) => ({ item, index }))
            .filter(({ item }) => item.section === section);

          if (sectionItems.length === 0) return null;

          return (
            <div key={section} className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {SECTION_LABELS[section]}
              </p>
              {sectionItems.map(({ item, index }) => {
                const exercise = exerciseById.get(item.exerciseId);
                return (
                  <div
                    key={`${item.exerciseId}-${index}`}
                    className="flex flex-col gap-2 rounded-md border border-zinc-200 p-3 dark:border-zinc-800"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        <input
                          type="checkbox"
                          checked={item.included}
                          onChange={(e) => updateItem(index, { included: e.target.checked })}
                        />
                        {exercise?.name ?? "Unknown exercise"}
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={item.plannedDurationMinutes}
                        onChange={(e) =>
                          updateItem(index, { plannedDurationMinutes: Number(e.target.value) })
                        }
                        className={`${inputClass} w-20`}
                      />
                    </div>
                    {exercise?.category && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {exercise.category}
                        {exercise.difficulty ? ` · ${exercise.difficulty}` : ""}
                      </p>
                    )}
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{item.rationale}</p>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setView("input")}
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          Start over
        </button>
        <button
          type="submit"
          disabled={isConfirming}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {isConfirming ? "Saving…" : "Save as training session"}
        </button>
      </div>
    </form>
  );
}
