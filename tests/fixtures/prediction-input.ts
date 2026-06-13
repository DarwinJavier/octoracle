import type { PredictionInput } from "@/lib/prediction/types";

export function predictionInput(
  overrides: Partial<PredictionInput> = {},
): PredictionInput {
  return {
    matchId: "00000000-0000-4000-8000-000000000001",
    stageType: "group",
    teamAId: "00000000-0000-4000-8000-00000000000a",
    teamAName: "Team A",
    teamBId: "00000000-0000-4000-8000-00000000000b",
    teamBName: "Team B",
    teamA: {
      longTermStrength: 0.75,
      recentForm: 0.72,
      attackingPerformance: 0.7,
      defensivePerformance: 0.68,
      squadAvailability: 0.9,
      publicConsensus: 0.65,
    },
    teamB: {
      longTermStrength: 0.45,
      recentForm: 0.5,
      attackingPerformance: 0.48,
      defensivePerformance: 0.5,
      squadAvailability: 0.75,
      publicConsensus: 0.4,
    },
    sourceCount: 0,
    kickoffAtUtc: "2026-06-11T19:00:00.000Z",
    ...overrides,
  };
}
