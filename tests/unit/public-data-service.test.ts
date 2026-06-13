import { describe, expect, it } from "vitest";

import type { NormalizedFixture } from "@/lib/fixtures/types";
import type { PublicDataRepository } from "@/lib/public-data/repository";
import { getFeaturedMatchResponse } from "@/lib/public-data/service";
import { staticPrediction } from "@/lib/static-match";

function fixture(
  status: NormalizedFixture["status"],
  updated = "2026-06-11T18:50:00.000Z",
): NormalizedFixture {
  return {
    providerId: "fixture-1",
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
    kickoffAtUtc:
      status === "scheduled"
        ? "2026-06-11T20:00:00.000Z"
        : "2026-06-11T18:00:00.000Z",
    venue: "Venue",
    city: "City",
    status,
    scoreA90: null,
    scoreB90: null,
    scoreAFinal: null,
    scoreBFinal: null,
    winnerProviderTeamId: null,
    lastProviderUpdateAt: updated,
  } satisfies NormalizedFixture;
}

function repository(
  fixtures: NormalizedFixture[],
  prediction: typeof staticPrediction | null = staticPrediction,
): PublicDataRepository {
  return {
    listFixtures: async () => fixtures,
    getPublishedPrediction: async () => prediction,
  };
}

describe("public featured-match service", () => {
  const now = new Date("2026-06-11T19:00:00.000Z");

  it("keeps an active match and frozen prediction visible", async () => {
    const response = await getFeaturedMatchResponse(
      repository([fixture("live")]),
      now,
      30,
    );
    expect(response.state).toBe("in_progress");
    expect(response.match?.id).toBe("fixture-1");
    expect(response.prediction?.version).toBe(1);
  });

  it("returns not_ready without fabricating a prediction", async () => {
    const response = await getFeaturedMatchResponse(
      repository([fixture("scheduled")], null),
      now,
      30,
    );
    expect(response.state).toBe("not_ready");
    expect(response.prediction).toBeNull();
  });

  it("returns stale and tournament-complete states explicitly", async () => {
    const stale = await getFeaturedMatchResponse(
      repository([fixture("scheduled", "2026-06-11T17:00:00.000Z")]),
      now,
      30,
    );
    const complete = await getFeaturedMatchResponse(
      repository([], null),
      now,
      30,
    );
    expect(stale.state).toBe("stale");
    expect(stale.warning).toContain("stale");
    expect(complete.state).toBe("tournament_complete");
  });

  it("permits only football-data.org crest URLs in public responses", async () => {
    const allowed = fixture("scheduled");
    if (allowed.teamA)
      allowed.teamA.flagAssetUrl = "https://crests.football-data.org/10.svg";
    if (allowed.teamB)
      allowed.teamB.flagAssetUrl = "https://unapproved.example/20.svg";

    const response = await getFeaturedMatchResponse(
      repository([allowed]),
      now,
      30,
    );

    expect(response.match?.teamA.flagAssetUrl).toBe(
      "https://crests.football-data.org/10.svg",
    );
    expect(response.match?.teamB.flagAssetUrl).toBeNull();
  });
});
