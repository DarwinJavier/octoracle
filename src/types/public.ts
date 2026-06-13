import { z } from "zod";

export const publicExperienceStateSchema = z.enum([
  "upcoming",
  "in_progress",
  "finished",
  "not_ready",
  "stale",
  "tournament_complete",
  "provider_error",
]);

export type PublicExperienceState = z.infer<typeof publicExperienceStateSchema>;

export const publicTeamSchema = z
  .object({
    id: z.string().min(1),
    fifaCode: z.string().min(2).max(4),
    flagAssetUrl: z.string().url().nullable(),
    flagEmoji: z.string(),
    name: z.string().min(1),
    shortName: z.string().min(1),
  })
  .strict();

export const publicMatchSchema = z
  .object({
    city: z.string().min(1),
    groupCode: z.string().min(1).nullable(),
    id: z.string().min(1),
    kickoffAtUtc: z.string().datetime(),
    matchNumber: z.number().int().positive().nullable(),
    stage: z.string().min(1),
    status: z.string().min(1),
    teamA: publicTeamSchema,
    teamB: publicTeamSchema,
    venue: z.string().min(1),
  })
  .strict();

export const publicPredictionSchema = z
  .object({
    animationSeed: z.string().min(1),
    confidence: z.enum(["low", "medium", "high"]),
    drawProbability: z.number().min(0).max(1),
    freezeAt: z.string().datetime(),
    frozenAt: z.string().datetime().nullable(),
    generatedAt: z.string().datetime(),
    predictedAdvancingTeamId: z.string().nullable(),
    predictedScoreA90: z.number().int().nonnegative(),
    predictedScoreB90: z.number().int().nonnegative(),
    publicExplanation: z.string().min(1),
    reasonCodes: z.array(z.string().min(1)).max(3),
    selectedOutcome: z.enum(["team_a", "draw", "team_b"]),
    sourceCount: z.number().int().nonnegative(),
    status: z.enum(["published", "frozen"]),
    teamAWinProbability: z.number().min(0).max(1),
    teamBWinProbability: z.number().min(0).max(1),
    version: z.number().int().positive(),
  })
  .strict();

export const publicResultSchema = z
  .object({
    scoreA90: z.number().int().nonnegative(),
    scoreB90: z.number().int().nonnegative(),
    scoreAFinal: z.number().int().nonnegative(),
    scoreBFinal: z.number().int().nonnegative(),
    winnerTeamId: z.string().nullable(),
  })
  .strict();

export const featuredMatchResponseSchema = z
  .object({
    dataSource: z.enum(["stored", "provider_preview", "demo"]),
    state: publicExperienceStateSchema,
    match: publicMatchSchema.nullable(),
    prediction: publicPredictionSchema.nullable(),
    result: publicResultSchema.nullable().default(null),
    alsoStarting: z.array(publicMatchSchema),
    warning: z.string().nullable(),
  })
  .strict();

export const predictionResponseSchema = z
  .object({
    state: publicExperienceStateSchema,
    prediction: publicPredictionSchema.nullable(),
  })
  .strict();

export const predictionHistoryItemSchema = z
  .object({
    match: publicMatchSchema,
    prediction: publicPredictionSchema,
    result: publicResultSchema,
    accuracy: z
      .object({
        outcomeCorrect: z.boolean(),
        exactScoreCorrect: z.boolean(),
        advancingTeamCorrect: z.boolean().nullable(),
      })
      .strict(),
  })
  .strict();

export const predictionHistoryResponseSchema = z
  .object({
    items: z.array(predictionHistoryItemSchema),
    total: z.number().int().nonnegative(),
    outcomeAccuracy: z.number().min(0).max(1).nullable(),
    exactScoreAccuracy: z.number().min(0).max(1).nullable(),
  })
  .strict();

export type Team = z.infer<typeof publicTeamSchema>;
export type PublicMatch = z.infer<typeof publicMatchSchema>;
export type PublicPrediction = z.infer<typeof publicPredictionSchema>;
export type PublicResult = z.infer<typeof publicResultSchema>;
export type FeaturedMatchResponse = z.infer<typeof featuredMatchResponseSchema>;
export type PredictionResponse = z.infer<typeof predictionResponseSchema>;
export type PredictionHistoryItem = z.infer<typeof predictionHistoryItemSchema>;
export type PredictionHistoryResponse = z.infer<
  typeof predictionHistoryResponseSchema
>;

// Transitional aliases keep the Step 2-3 components replaceable while Step 6 removes static sourcing.
export type StaticMatch = PublicMatch;
export type StaticPrediction = PublicPrediction;
