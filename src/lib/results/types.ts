import { z } from "zod";

export const finalResultSchema = z
  .object({
    matchProviderId: z.string().min(1),
    status: z.enum([
      "finished",
      "finished_after_extra_time",
      "finished_after_penalties",
    ]),
    scoreA90: z.number().int().nonnegative(),
    scoreB90: z.number().int().nonnegative(),
    scoreAFinal: z.number().int().nonnegative(),
    scoreBFinal: z.number().int().nonnegative(),
    winnerProviderTeamId: z.string().min(1).nullable(),
    providerUpdatedAt: z.string().datetime(),
  })
  .strict()
  .superRefine((result, context) => {
    if (
      result.status === "finished" &&
      (result.scoreA90 !== result.scoreAFinal ||
        result.scoreB90 !== result.scoreBFinal)
    ) {
      context.addIssue({
        code: "custom",
        message: "Normal-time final score must equal the 90-minute score",
      });
    }
    if (result.status !== "finished" && !result.winnerProviderTeamId) {
      context.addIssue({
        code: "custom",
        message: "Knockout resolution requires a winner",
      });
    }
  });

export type FinalResult = z.infer<typeof finalResultSchema>;

export const accuracyResultSchema = z
  .object({
    outcomeCorrect: z.boolean(),
    exactScoreCorrect: z.boolean(),
    advancingTeamCorrect: z.boolean().nullable(),
  })
  .strict();

export type AccuracyResult = z.infer<typeof accuracyResultSchema>;
