import { describe, expect, it } from "vitest";

import {
  finalResultFromFixture,
  calculatePredictionAccuracy,
} from "@/lib/results/service";
import type { NormalizedFixture } from "@/lib/fixtures/types";
import { staticPrediction } from "@/lib/static-match";

function finishedFixture(
  overrides: Partial<NormalizedFixture> = {},
): NormalizedFixture {
  return {
    providerId: "match-1",
    officialMatchNumber: 1,
    stage: "Group Stage",
    groupCode: "A",
    teamA: {
      providerId: "a",
      name: "A",
      shortName: "A",
      fifaCode: "AAA",
      flagAssetUrl: null,
    },
    teamB: {
      providerId: "b",
      name: "B",
      shortName: "B",
      fifaCode: "BBB",
      flagAssetUrl: null,
    },
    teamAPlaceholder: null,
    teamBPlaceholder: null,
    kickoffAtUtc: "2026-06-11T19:00:00.000Z",
    venue: "Venue",
    city: "City",
    status: "finished",
    scoreA90: 2,
    scoreB90: 1,
    scoreAFinal: 2,
    scoreBFinal: 1,
    winnerProviderTeamId: "a",
    lastProviderUpdateAt: "2026-06-11T21:00:00.000Z",
    ...overrides,
  };
}

describe("result resolution and accuracy", () => {
  it("normalizes a completed result and rejects incomplete finished fixtures", () => {
    expect(finalResultFromFixture(finishedFixture())?.scoreAFinal).toBe(2);
    expect(() =>
      finalResultFromFixture(finishedFixture({ scoreA90: null })),
    ).toThrow("missing_scores");
    expect(() =>
      finalResultFromFixture(
        finishedFixture({ winnerProviderTeamId: "not-a-participant" }),
      ),
    ).toThrow("invalid_winner");
  });

  it("scores the exact frozen 90-minute prediction", () => {
    const result = finalResultFromFixture(finishedFixture())!;
    expect(
      calculatePredictionAccuracy(staticPrediction, result, "a", "b"),
    ).toEqual({
      outcomeCorrect: true,
      exactScoreCorrect: true,
      advancingTeamCorrect: null,
    });
  });

  it("scores knockout advancement separately from a 90-minute draw", () => {
    const result = finalResultFromFixture(
      finishedFixture({
        status: "finished_after_penalties",
        scoreA90: 1,
        scoreB90: 1,
        scoreAFinal: 5,
        scoreBFinal: 4,
      }),
    )!;
    expect(
      calculatePredictionAccuracy(
        {
          ...staticPrediction,
          selectedOutcome: "draw",
          predictedScoreA90: 1,
          predictedScoreB90: 1,
          predictedAdvancingTeamId: "a",
        },
        result,
        "a",
        "b",
      ),
    ).toEqual({
      outcomeCorrect: true,
      exactScoreCorrect: true,
      advancingTeamCorrect: true,
    });
  });
});
