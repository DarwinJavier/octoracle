import { z } from "zod";

export const matchStatusSchema = z.enum([
  "scheduled",
  "live",
  "halftime",
  "finished",
  "finished_after_extra_time",
  "finished_after_penalties",
  "postponed",
  "suspended",
  "cancelled",
  "abandoned",
  "unknown",
]);

export type MatchStatus = z.infer<typeof matchStatusSchema>;

export const normalizedTeamSchema = z
  .object({
    providerId: z.string().min(1),
    name: z.string().min(1),
    shortName: z.string().min(1).nullable(),
    fifaCode: z.string().min(2).max(4).nullable(),
    flagAssetUrl: z.string().url().nullable(),
  })
  .strict();

export type NormalizedTeam = z.infer<typeof normalizedTeamSchema>;

const nullableScore = z.number().int().nonnegative().nullable();

export const normalizedFixtureSchema = z
  .object({
    providerId: z.string().min(1),
    officialMatchNumber: z.number().int().positive().nullable(),
    stage: z.string().min(1),
    groupCode: z.string().min(1).nullable(),
    teamA: normalizedTeamSchema.nullable(),
    teamB: normalizedTeamSchema.nullable(),
    teamAPlaceholder: z.string().min(1).nullable(),
    teamBPlaceholder: z.string().min(1).nullable(),
    kickoffAtUtc: z.string().datetime().nullable(),
    venue: z.string().min(1).nullable(),
    city: z.string().min(1).nullable(),
    status: matchStatusSchema,
    scoreA90: nullableScore,
    scoreB90: nullableScore,
    scoreAFinal: nullableScore,
    scoreBFinal: nullableScore,
    winnerProviderTeamId: z.string().min(1).nullable(),
    lastProviderUpdateAt: z.string().datetime(),
  })
  .strict()
  .superRefine((fixture, context) => {
    if (!fixture.teamA && !fixture.teamAPlaceholder) {
      context.addIssue({
        code: "custom",
        message: "Team A or its placeholder is required",
      });
    }
    if (!fixture.teamB && !fixture.teamBPlaceholder) {
      context.addIssue({
        code: "custom",
        message: "Team B or its placeholder is required",
      });
    }
  });

export type NormalizedFixture = z.infer<typeof normalizedFixtureSchema>;

export type FixtureProvider = {
  fetchFixtures(): Promise<NormalizedFixture[]>;
};

export type FixtureResolution = {
  match: NormalizedFixture | null;
  alsoStarting: NormalizedFixture[];
  stale: boolean;
  tournamentComplete: boolean;
};
