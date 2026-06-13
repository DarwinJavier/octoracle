import { describe, expect, it } from "vitest";

import {
  FootballDataFixtureProvider,
  normalizeFootballDataFixture,
  parseFootballDataResponse,
} from "@/lib/fixtures/providers/football-data";
import {
  footballDataLiveFixture,
  footballDataScheduledFixture,
} from "../fixtures/football-data-fixtures";

describe("football-data.org fixture normalization", () => {
  it("normalizes required fixture, participant, venue, stage, and state fields", () => {
    const fixture = normalizeFootballDataFixture(footballDataLiveFixture);
    expect(fixture).toMatchObject({
      providerId: "2001",
      officialMatchNumber: 1,
      stage: "Group stage",
      groupCode: "A",
      status: "live",
      teamA: { fifaCode: "MEX" },
      teamB: { fifaCode: "RSA" },
      venue: "Mexico City Stadium",
      city: null,
      scoreAFinal: null,
      scoreBFinal: null,
    });
  });

  it("preserves placeholders when participants are unknown", () => {
    const fixture = normalizeFootballDataFixture({
      ...footballDataScheduledFixture,
      id: 2002,
      homeTeam: { id: null, name: "Winner Match 1" },
      awayTeam: { id: null, name: "Winner Match 2" },
    });
    expect(fixture.teamAPlaceholder).toBe("Winner Match 1");
    expect(fixture.teamBPlaceholder).toBe("Winner Match 2");
  });

  it("uses a human-verified location only when the provider omits it", () => {
    const fixture = normalizeFootballDataFixture({
      ...footballDataScheduledFixture,
      id: 537333,
      venue: null,
    });

    expect(fixture).toMatchObject({
      city: "Toronto",
      venue: "Toronto Stadium",
    });
  });

  it("rejects malformed provider responses", () => {
    expect(() =>
      parseFootballDataResponse({ matches: [{ id: "bad" }] }),
    ).toThrow();
  });

  it("requests only the fixed World Cup endpoint with header authentication", async () => {
    const requests: Array<{
      cache: RequestCache | undefined;
      headers: Headers;
      next: RequestInit["next"];
      url: URL;
    }> = [];
    const provider = new FootballDataFixtureProvider({
      apiKey: "test-key",
      fetchImplementation: async (input, init) => {
        requests.push({
          cache: init?.cache,
          headers: new Headers(init?.headers),
          next: init?.next,
          url: new URL(input.toString()),
        });
        return Response.json({ matches: [] });
      },
    });

    await provider.fetchFixtures();

    expect(requests).toHaveLength(1);
    expect(requests[0].url.href).toBe(
      "https://api.football-data.org/v4/competitions/WC/matches?season=2026&dateFrom=2026-06-11&dateTo=2026-07-20",
    );
    expect(requests[0].headers.get("X-Auth-Token")).toBe("test-key");
    expect(requests[0].cache).toBe("force-cache");
    expect(requests[0].next?.revalidate).toBe(60);
  });

  it("requests only a validated team-history endpoint for completed matches", async () => {
    const requests: URL[] = [];
    const provider = new FootballDataFixtureProvider({
      apiKey: "test-key",
      fetchImplementation: async (input) => {
        requests.push(new URL(input.toString()));
        return Response.json({ matches: [footballDataScheduledFixture] });
      },
    });

    await provider.fetchCompletedTeamMatches(
      "10",
      "2026-06-11T19:00:00.000Z",
      8,
    );

    expect(requests[0].href).toBe(
      "https://api.football-data.org/v4/teams/10/matches?status=FINISHED&dateFrom=2024-06-11&dateTo=2026-06-11",
    );
    await expect(
      provider.fetchCompletedTeamMatches(
        "https://evil.test",
        "2026-06-11T19:00:00.000Z",
      ),
    ).rejects.toThrow();
  });

  it("separates a knockout 90-minute draw from the penalties result", () => {
    const fixture = normalizeFootballDataFixture({
      ...footballDataScheduledFixture,
      status: "FINISHED",
      stage: "LAST_32",
      score: {
        winner: "HOME_TEAM",
        duration: "PENALTY_SHOOTOUT",
        regularTime: { home: 1, away: 1 },
        fullTime: { home: 1, away: 1 },
        penalties: { home: 5, away: 4 },
      },
    });
    expect(fixture).toMatchObject({
      status: "finished_after_penalties",
      scoreA90: 1,
      scoreB90: 1,
      scoreAFinal: 5,
      scoreBFinal: 4,
      winnerProviderTeamId: "10",
    });
  });
});
