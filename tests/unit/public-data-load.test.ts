import { afterEach, describe, expect, it, vi } from "vitest";

import { loadPredictionHistory } from "@/lib/history/load";
import {
  demoFeaturedMatch,
  loadDailyMatches,
  loadFeaturedMatch,
} from "@/lib/public-data/load";
import { footballDataScheduledFixture } from "../fixtures/football-data-fixtures";

const futureFixture = {
  ...footballDataScheduledFixture,
  id: 6001,
  utcDate: "2026-06-20T19:00:00Z",
  lastUpdated: "2026-06-13T10:00:00Z",
};

function footballResponse(fixtures: unknown[]) {
  return vi.fn(async (request: RequestInfo | URL) => {
    const url = String(request);
    if (url.includes("supabase.test/rest/v1/matches")) {
      return Response.json([]);
    }
    if (url.includes("supabase.test/rest/v1/predictions")) {
      return Response.json([]);
    }
    if (url.includes("supabase.test/rest/v1/rpc/prediction_history")) {
      return Response.json([]);
    }
    if (url.includes("api.football-data.org/v4/competitions/WC/matches")) {
      return Response.json({ matches: fixtures });
    }
    if (url.includes("api.football-data.org/v4/teams/")) {
      return Response.json({ matches: [] });
    }
    throw new Error(`Unexpected request: ${url}`);
  });
}

describe("public data loading fallbacks", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("uses provider fixtures when configured Supabase storage is empty", async () => {
    vi.stubEnv("SUPABASE_URL", "https://supabase.test");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-key");
    vi.stubEnv("FOOTBALL_DATA_API_KEY", "test-football-key");
    vi.stubGlobal("fetch", footballResponse([futureFixture]));

    const response = await loadFeaturedMatch();

    expect(response.dataSource).toBe("provider_preview");
    expect(response.match?.id).toBe("6001");
  });

  it("loads every provider match for the selected day even from a stored response", async () => {
    vi.stubEnv("FOOTBALL_DATA_API_KEY", "test-football-key");
    vi.stubGlobal(
      "fetch",
      footballResponse([
        futureFixture,
        {
          ...futureFixture,
          id: 6002,
          utcDate: "2026-06-20T22:00:00Z",
        },
      ]),
    );

    const matches = await loadDailyMatches({
      ...demoFeaturedMatch(),
      match: {
        ...demoFeaturedMatch().match!,
        kickoffAtUtc: futureFixture.utcDate,
      },
    });

    expect(matches.map(({ match }) => match.id)).toEqual(["6001", "6002"]);
  });

  it("keeps recorded preview predictions in accuracy history with real results", async () => {
    vi.stubEnv("FOOTBALL_DATA_API_KEY", "test-football-key");
    vi.stubGlobal(
      "fetch",
      footballResponse([
        {
          ...footballDataScheduledFixture,
          id: 537333,
          status: "FINISHED",
          score: {
            winner: "DRAW",
            duration: "REGULAR",
            fullTime: { home: 1, away: 1 },
          },
        },
      ]),
    );

    const history = await loadPredictionHistory();

    expect(history.total).toBe(1);
    expect(history.outcomeAccuracy).toBe(1);
    expect(history.exactScoreAccuracy).toBe(1);
    expect(history.items[0]).toMatchObject({
      match: { id: "537333" },
      prediction: { predictedScoreA90: 1, predictedScoreB90: 1 },
      result: { scoreA90: 1, scoreB90: 1 },
    });
  });
});
