import { z } from "zod";

import {
  normalizedFixtureSchema,
  type NormalizedFixture,
} from "@/lib/fixtures/types";
import { teamSignalsSchema } from "@/lib/prediction/types";

const signalHistorySchema = z
  .object({
    teamProviderId: z.string().min(1),
    fixtures: z.array(normalizedFixtureSchema),
  })
  .strict();

type TeamMatch = {
  goalsFor: number;
  goalsAgainst: number;
  result: number;
};

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}

function perspective(
  fixture: NormalizedFixture,
  teamProviderId: string,
): TeamMatch | null {
  const isTeamA = fixture.teamA?.providerId === teamProviderId;
  const isTeamB = fixture.teamB?.providerId === teamProviderId;
  if (!isTeamA && !isTeamB) return null;
  if (fixture.scoreA90 === null || fixture.scoreB90 === null) return null;
  const goalsFor = isTeamA ? fixture.scoreA90 : fixture.scoreB90;
  const goalsAgainst = isTeamA ? fixture.scoreB90 : fixture.scoreA90;
  return {
    goalsFor,
    goalsAgainst,
    result: goalsFor > goalsAgainst ? 1 : goalsFor === goalsAgainst ? 0.5 : 0,
  };
}

function weightedAverage(
  matches: TeamMatch[],
  value: (match: TeamMatch) => number,
) {
  if (matches.length === 0) return 0.5;
  let weighted = 0;
  let weights = 0;
  for (const [index, match] of matches.entries()) {
    const weight = Math.exp(-index / 6);
    weighted += value(match) * weight;
    weights += weight;
  }
  return weighted / weights;
}

export function calculateHistorySignals(
  teamProviderId: string,
  rawFixtures: NormalizedFixture[],
) {
  const { fixtures } = signalHistorySchema.parse({
    teamProviderId,
    fixtures: rawFixtures,
  });
  const matches = fixtures
    .map((fixture) => perspective(fixture, teamProviderId))
    .filter((match): match is TeamMatch => match !== null);

  const recent = matches.slice(0, 8);
  const longTerm = matches.slice(0, 20);
  const longTermResults = weightedAverage(longTerm, (match) => match.result);
  const longTermGoalDifference = weightedAverage(longTerm, (match) =>
    clamp(0.5 + (match.goalsFor - match.goalsAgainst) / 6),
  );

  return teamSignalsSchema.parse({
    longTermStrength: clamp(
      longTermResults * 0.75 + longTermGoalDifference * 0.25,
    ),
    recentForm: clamp(weightedAverage(recent, (match) => match.result)),
    attackingPerformance: clamp(
      weightedAverage(recent, (match) => match.goalsFor / 3),
    ),
    defensivePerformance: clamp(
      weightedAverage(recent, (match) => 1 - match.goalsAgainst / 3),
    ),
    squadAvailability: 0.5,
    publicConsensus: 0.5,
  });
}
