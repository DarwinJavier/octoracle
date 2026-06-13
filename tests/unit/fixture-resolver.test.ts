import { describe, expect, it } from "vitest";

import {
  resolveFeaturedMatch,
  resolveNextScheduledMatch,
} from "@/lib/fixtures/resolver";
import type { MatchStatus, NormalizedFixture } from "@/lib/fixtures/types";

const now = new Date("2026-06-11T18:00:00.000Z");

function fixture(
  providerId: string,
  kickoffAtUtc: string | null,
  status: MatchStatus = "scheduled",
  matchNumber: number | null = 1,
): NormalizedFixture {
  return {
    providerId,
    officialMatchNumber: matchNumber,
    stage: "Group Stage",
    groupCode: "A",
    teamA: null,
    teamB: null,
    teamAPlaceholder: "Team A",
    teamBPlaceholder: "Team B",
    kickoffAtUtc,
    venue: null,
    city: null,
    status,
    scoreA90: null,
    scoreB90: null,
    scoreAFinal: null,
    scoreBFinal: null,
    winnerProviderTeamId: null,
    lastProviderUpdateAt: "2026-06-11T17:50:00.000Z",
  };
}

describe("fixture resolvers", () => {
  it("keeps an active match featured instead of switching to the next scheduled match", () => {
    const active = fixture("active", "2026-06-11T17:00:00.000Z", "live");
    const next = fixture("next", "2026-06-11T19:00:00.000Z");
    expect(
      resolveFeaturedMatch([next, active], now, 30).match?.providerId,
    ).toBe("active");
  });

  it("breaks simultaneous kickoff ties by match number then provider ID", () => {
    const kickoff = "2026-06-11T19:00:00.000Z";
    const result = resolveNextScheduledMatch(
      [
        fixture("z", kickoff, "scheduled", 2),
        fixture("b", kickoff),
        fixture("a", kickoff),
      ],
      now,
      30,
    );
    expect(result.match?.providerId).toBe("a");
    expect(result.alsoStarting.map((match) => match.providerId)).toEqual([
      "b",
      "z",
    ]);
  });

  it("excludes postponed and cancelled matches", () => {
    const kickoff = "2026-06-11T19:00:00.000Z";
    const result = resolveNextScheduledMatch(
      [
        fixture("postponed", kickoff, "postponed"),
        fixture("cancelled", kickoff, "cancelled"),
      ],
      now,
      30,
    );
    expect(result.tournamentComplete).toBe(true);
    expect(result.match).toBeNull();
  });

  it("reports stale selected fixture data", () => {
    const stale = {
      ...fixture("stale", "2026-06-11T19:00:00.000Z"),
      lastProviderUpdateAt: "2026-06-11T16:00:00.000Z",
    };
    expect(resolveNextScheduledMatch([stale], now, 30).stale).toBe(true);
  });
});
