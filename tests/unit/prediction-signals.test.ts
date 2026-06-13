import { describe, expect, it } from "vitest";

import type { NormalizedFixture } from "@/lib/fixtures/types";
import { calculateHistorySignals } from "@/lib/prediction/signals/history";

function fixture(
  id: string,
  scoreA: number,
  scoreB: number,
): NormalizedFixture {
  return {
    providerId: id,
    officialMatchNumber: null,
    stage: "Friendly",
    groupCode: null,
    teamA: {
      providerId: "a",
      name: "Team A",
      shortName: "A",
      fifaCode: "AAA",
      flagAssetUrl: null,
    },
    teamB: {
      providerId: "b",
      name: "Team B",
      shortName: "B",
      fifaCode: "BBB",
      flagAssetUrl: null,
    },
    teamAPlaceholder: null,
    teamBPlaceholder: null,
    kickoffAtUtc: "2026-06-01T18:00:00.000Z",
    venue: null,
    city: null,
    status: "finished",
    scoreA90: scoreA,
    scoreB90: scoreB,
    scoreAFinal: scoreA,
    scoreBFinal: scoreB,
    winnerProviderTeamId: scoreA > scoreB ? "a" : scoreB > scoreA ? "b" : null,
    lastProviderUpdateAt: "2026-06-01T20:00:00.000Z",
  };
}

describe("historical prediction signals", () => {
  it("gives stronger signals to a winning, higher-scoring team", () => {
    const history = [
      fixture("1", 3, 0),
      fixture("2", 2, 1),
      fixture("3", 1, 0),
    ];
    const teamA = calculateHistorySignals("a", history);
    const teamB = calculateHistorySignals("b", history);

    expect(teamA.longTermStrength).toBeGreaterThan(teamB.longTermStrength);
    expect(teamA.recentForm).toBeGreaterThan(teamB.recentForm);
    expect(teamA.attackingPerformance).toBeGreaterThan(
      teamB.attackingPerformance,
    );
    expect(teamA.defensivePerformance).toBeGreaterThan(
      teamB.defensivePerformance,
    );
    expect(teamA.squadAvailability).toBe(0.5);
    expect(teamA.publicConsensus).toBe(0.5);
  });

  it("uses neutral values when no completed history is available", () => {
    expect(calculateHistorySignals("a", [])).toEqual({
      longTermStrength: 0.5,
      recentForm: 0.5,
      attackingPerformance: 0.5,
      defensivePerformance: 0.5,
      squadAvailability: 0.5,
      publicConsensus: 0.5,
    });
  });
});
