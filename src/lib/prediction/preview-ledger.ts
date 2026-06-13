import { publicPredictionSchema } from "@/types/public";

const RECORDED_PREVIEW_PREDICTIONS = {
  "537333": publicPredictionSchema.parse({
    animationSeed: "canada-bosnia-preview-v1",
    confidence: "high",
    drawProbability: 0.64,
    freezeAt: "2026-06-12T19:00:00.000Z",
    frozenAt: "2026-06-12T19:00:00.000Z",
    generatedAt: "2026-06-12T11:15:00.000Z",
    predictedAdvancingTeamId: null,
    predictedScoreA90: 1,
    predictedScoreB90: 1,
    publicExplanation:
      "The model saw a closely matched contest with limited validated separation between the teams.",
    reasonCodes: ["closely_matched"],
    selectedOutcome: "draw",
    sourceCount: 0,
    status: "frozen",
    teamAWinProbability: 0.18,
    teamBWinProbability: 0.18,
    version: 1,
  }),
  "537345": publicPredictionSchema.parse({
    animationSeed: "usa-paraguay-preview-v1",
    confidence: "high",
    drawProbability: 0.64,
    freezeAt: "2026-06-13T01:00:00.000Z",
    frozenAt: null,
    generatedAt: "2026-06-13T00:37:00.000Z",
    predictedAdvancingTeamId: null,
    predictedScoreA90: 1,
    predictedScoreB90: 1,
    publicExplanation:
      "The model saw a closely matched contest with limited validated separation between the teams.",
    reasonCodes: ["closely_matched"],
    selectedOutcome: "draw",
    sourceCount: 0,
    status: "published",
    teamAWinProbability: 0.18,
    teamBWinProbability: 0.18,
    version: 1,
  }),
} as const;

export function recordedPreviewPredictionIds() {
  return Object.keys(RECORDED_PREVIEW_PREDICTIONS);
}

export function recordedPreviewPredictionFor(matchProviderId: string) {
  return (
    RECORDED_PREVIEW_PREDICTIONS[
      matchProviderId as keyof typeof RECORDED_PREVIEW_PREDICTIONS
    ] ?? null
  );
}
