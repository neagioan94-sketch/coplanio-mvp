import Anthropic from "@anthropic-ai/sdk";
import { llmDraftSchema, type LlmDraft, PLAN_SECTIONS } from "@/schemas/ai-training-planner";
import type { ExerciseRow } from "@/lib/exercises/get-exercises";
import type { TeamRow } from "@/lib/teams/get-teams";

let cachedClient: Anthropic | null = null;

export function getAnthropicClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!cachedClient) {
    cachedClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return cachedClient;
}

export function buildTrainingPlanSchema(allowedExerciseIds: string[]) {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      title: { type: "string" },
      objective: { type: "string" },
      suggested_duration_minutes: { type: "integer" },
      sections: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            section: { type: "string", enum: [...PLAN_SECTIONS] },
            items: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  exercise_id: { type: "string", enum: allowedExerciseIds },
                  planned_duration_minutes: { type: "integer" },
                  rationale: { type: "string" },
                },
                required: ["exercise_id", "planned_duration_minutes", "rationale"],
              },
            },
          },
          required: ["section", "items"],
        },
      },
    },
    required: ["title", "objective", "suggested_duration_minutes", "sections"],
  } as const;
}

interface BuildPromptInput {
  team: Pick<TeamRow, "name" | "ageGroup" | "level">;
  focus: string;
  targetDurationMinutes?: number;
  maxExerciseCount?: number;
  exercises: ExerciseRow[];
}

const SYSTEM_PROMPT = [
  "You are assisting a football/soccer coach in drafting a training session plan.",
  "You must only recommend exercises from the provided list of existing exercises.",
  "Never invent new exercises or reference an exercise not in the provided list.",
  "Do not give medical, injury, or player-specific evaluation advice.",
  "Base your plan only on the team context, the coach's stated focus, and the exercise catalog provided.",
].join(" ");

export function buildTrainingPlanPrompt({
  team,
  focus,
  targetDurationMinutes,
  maxExerciseCount,
  exercises,
}: BuildPromptInput): { system: string; user: string } {
  const exerciseLines = exercises
    .map(
      (e) =>
        `${e.id} | ${e.name} | ${e.category ?? "-"} | ${e.difficulty ?? "-"} | ${e.durationMinutes ?? "-"} | ${e.objective} | ${e.tags.join(",")}`,
    )
    .join("\n");

  const user = [
    `Team: ${team.name} (age group: ${team.ageGroup ?? "unspecified"}, level: ${team.level ?? "unspecified"})`,
    `Coach's session focus: ${focus}`,
    `Target total duration: ${targetDurationMinutes ?? "unspecified"} minutes`,
    `Max exercises to recommend: ${maxExerciseCount ?? 8}`,
    "",
    "Available exercises (id | name | category | difficulty | duration_minutes | objective | tags):",
    exerciseLines,
  ].join("\n");

  return { system: SYSTEM_PROMPT, user };
}

interface GenerateTrainingPlanDraftInput {
  team: Pick<TeamRow, "name" | "ageGroup" | "level">;
  focus: string;
  targetDurationMinutes?: number;
  maxExerciseCount?: number;
  exercises: ExerciseRow[];
}

export async function generateTrainingPlanDraft(
  input: GenerateTrainingPlanDraftInput,
): Promise<LlmDraft> {
  const client = getAnthropicClient();
  if (!client) throw new Error("ANTHROPIC_API_KEY not configured");

  const allowedExerciseIds = input.exercises.map((e) => e.id);
  const schema = buildTrainingPlanSchema(allowedExerciseIds);
  const { system, user } = buildTrainingPlanPrompt(input);

  const response = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 4096,
    system,
    messages: [{ role: "user", content: user }],
    output_config: {
      format: { type: "json_schema", schema },
    },
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No structured output returned by the model");
  }

  const parsedJson: unknown = JSON.parse(textBlock.text);
  return llmDraftSchema.parse(parsedJson);
}
