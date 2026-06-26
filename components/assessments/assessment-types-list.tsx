import Link from "next/link";
import type { AssessmentTypeRow } from "@/lib/assessments/get-assessments";
import ArchiveAssessmentTypeButton from "./archive-assessment-type-button";

interface AssessmentTypesListProps {
  types: AssessmentTypeRow[];
  canManage: boolean;
  organizationId: string;
}

export function AssessmentTypesList({ types, canManage, organizationId }: AssessmentTypesListProps) {
  if (types.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">No assessment types yet.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-zinc-500 dark:text-zinc-400">
            <th className="pb-2 pr-4 font-medium">Name</th>
            <th className="pb-2 pr-4 font-medium">Category</th>
            <th className="pb-2 pr-4 font-medium">Unit</th>
            <th className="pb-2 pr-4 font-medium">Direction</th>
            {canManage && <th className="pb-2 font-medium">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {types.map((t) => (
            <tr key={t.id} className="border-b last:border-0">
              <td className="py-2 pr-4 font-medium text-zinc-900 dark:text-zinc-50">{t.name}</td>
              <td className="py-2 pr-4 text-zinc-500 dark:text-zinc-400">{t.category ?? "—"}</td>
              <td className="py-2 pr-4 text-zinc-500 dark:text-zinc-400">{t.unit ?? "—"}</td>
              <td className="py-2 pr-4 text-zinc-500 dark:text-zinc-400">
                {t.higherIsBetter === true
                  ? "↑ Higher"
                  : t.higherIsBetter === false
                    ? "↓ Lower"
                    : "—"}
              </td>
              {canManage && (
                <td className="py-2">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/assessments/types/${t.id}/edit`}
                      className="text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                    >
                      Edit
                    </Link>
                    <ArchiveAssessmentTypeButton
                      assessmentTypeId={t.id}
                      organizationId={organizationId}
                    />
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
