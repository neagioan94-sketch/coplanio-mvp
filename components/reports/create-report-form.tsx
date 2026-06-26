"use client";

import { useState } from "react";
import { useActionState } from "react";
import { createReportAction } from "@/lib/reports/actions";
import { REPORT_TYPES, SOURCE_ENTITY_TYPES } from "@/schemas/reports";
import type { PlayerRow } from "@/lib/players/get-players";
import type { TeamRow } from "@/lib/teams/get-teams";
import type { TrainingSessionRow } from "@/lib/training-sessions/get-training-sessions";
import type { MatchRow } from "@/lib/matches/get-matches";
import type { AssessmentResultRow } from "@/lib/assessments/get-assessments";

const INPUT_CLASS =
  "rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 w-full";

const LABEL_CLASS = "text-sm font-medium text-zinc-700 dark:text-zinc-300";

const REPORT_TYPE_LABELS: Record<string, string> = {
  player_summary: "Player Summary",
  team_summary: "Team Summary",
  session_summary: "Session Summary",
  match_summary: "Match Summary",
  assessment_summary: "Assessment Summary",
};

const SOURCE_ENTITY_LABELS: Record<string, string> = {
  player: "Player",
  team: "Team",
  training_session: "Training Session",
  match: "Match",
  assessment: "Assessment Result",
};

type ActionState = { error?: string; success?: boolean } | undefined;

interface CreateReportFormProps {
  organizationId: string;
  players: PlayerRow[];
  teams: TeamRow[];
  sessions: TrainingSessionRow[];
  matches: MatchRow[];
  assessmentResults: AssessmentResultRow[];
}

export default function CreateReportForm({
  organizationId,
  players,
  teams,
  sessions,
  matches,
  assessmentResults,
}: CreateReportFormProps) {
  const [state, action, isPending] = useActionState<ActionState, FormData>(
    createReportAction,
    undefined,
  );
  const [entityType, setEntityType] = useState("");

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="organizationId" value={organizationId} />

      {state?.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {state.error}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="title" className={LABEL_CLASS}>
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          placeholder="e.g. Q1 Player Progress Report"
          className={INPUT_CLASS}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="report_type" className={LABEL_CLASS}>
          Report type <span className="text-red-500">*</span>
        </label>
        <select id="report_type" name="report_type" required className={INPUT_CLASS}>
          <option value="">Select a type…</option>
          {REPORT_TYPES.map((t) => (
            <option key={t} value={t}>
              {REPORT_TYPE_LABELS[t] ?? t}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="source_entity_type" className={LABEL_CLASS}>
          Source entity type
        </label>
        <select
          id="source_entity_type"
          name="source_entity_type"
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
          className={INPUT_CLASS}
        >
          <option value="">None</option>
          {SOURCE_ENTITY_TYPES.map((t) => (
            <option key={t} value={t}>
              {SOURCE_ENTITY_LABELS[t] ?? t}
            </option>
          ))}
        </select>
      </div>

      {entityType === "player" && players.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="source_entity_id_player" className={LABEL_CLASS}>
            Player
          </label>
          <select id="source_entity_id_player" name="source_entity_id" className={INPUT_CLASS}>
            <option value="">Select a player…</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.displayName ?? `${p.firstName} ${p.lastName}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {entityType === "team" && teams.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="source_entity_id_team" className={LABEL_CLASS}>
            Team
          </label>
          <select id="source_entity_id_team" name="source_entity_id" className={INPUT_CLASS}>
            <option value="">Select a team…</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {entityType === "training_session" && sessions.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="source_entity_id_session" className={LABEL_CLASS}>
            Training session
          </label>
          <select id="source_entity_id_session" name="source_entity_id" className={INPUT_CLASS}>
            <option value="">Select a session…</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} ({s.sessionDate})
              </option>
            ))}
          </select>
        </div>
      )}

      {entityType === "match" && matches.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="source_entity_id_match" className={LABEL_CLASS}>
            Match
          </label>
          <select id="source_entity_id_match" name="source_entity_id" className={INPUT_CLASS}>
            <option value="">Select a match…</option>
            {matches.map((m) => (
              <option key={m.id} value={m.id}>
                vs {m.opponent} ({m.matchDate})
              </option>
            ))}
          </select>
        </div>
      )}

      {entityType === "assessment" && assessmentResults.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="source_entity_id_assessment" className={LABEL_CLASS}>
            Assessment result
          </label>
          <select
            id="source_entity_id_assessment"
            name="source_entity_id"
            className={INPUT_CLASS}
          >
            <option value="">Select a result…</option>
            {assessmentResults.map((a) => (
              <option key={a.id} value={a.id}>
                {a.assessmentTypeName} — {a.playerName} ({a.assessedAt})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="summary" className={LABEL_CLASS}>
          Summary
        </label>
        <textarea
          id="summary"
          name="summary"
          rows={3}
          placeholder="Optional: describe what this report covers"
          className={INPUT_CLASS}
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {isPending ? "Creating…" : "Create report"}
        </button>
      </div>
    </form>
  );
}
