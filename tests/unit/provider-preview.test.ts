import { afterEach, describe, expect, it, vi } from "vitest";

import {
  loadProviderDayMatches,
  loadProviderPreview,
  loadRecordedProviderHistory,
} from "@/lib/public-data/provider-preview";
import {
  footballDataLiveFixture,
  footballDataScheduledFixture,
} from "../fixtures/football-data-fixtures";
import { recordedPreviewPredictionIds } from "@/lib/prediction/preview-ledger";

function completedHistory() {
  return [1, 2, 3].map((id) => ({
    ...footballDataScheduledFixture,
    id: 3000 + id,
    status: "FINISHED",
    utcDate: `2026-05-0${id}T19:00:00Z`,
    score: {
      winner: "HOME_TEAM",
      duration: "REGULAR",
      fullTime: { home: 2, away: 0 },
    },
  }));
}

function fifaRankings() {
  return {
    Results: [
      {
        IdCountry: "MEX",
        Rank: 15,
        DecimalTotalPoints: 1650,
        DecimalPrevPoints: 1645,
        PubDate: "2026-06-11T10:00:00+00:00",
      },
      {
        IdCountry: "RSA",
        Rank: 60,
        DecimalTotalPoints: 1400,
        DecimalPrevPoints: 1405,
        PubDate: "2026-06-11T10:00:00+00:00",
      },
    ],
  };
}

describe("football-data.org provider preview", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("keeps every reviewed preview prediction in the immutable fallback ledger", () => {
    expect(recordedPreviewPredictionIds()).toEqual(
      expect.arrayContaining([
        "537333",
        "537345",
        "537334",
        "537339",
        "537340",
        "537346",
        "537351",
        "537357",
      ]),
    );
  });

  it("renders a deterministic MVP prediction from validated provider data", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (request: RequestInfo | URL) => {
        const url = String(request);
        if (url.includes("/competitions/WC/matches")) {
          return Response.json({ matches: [footballDataScheduledFixture] });
        }
        return Response.json({ matches: completedHistory() });
      }),
    );

    const response = await loadProviderPreview(
      "test-key",
      new Date("2026-06-11T12:00:00.000Z"),
      1_000_000,
    );

    expect(response.dataSource).toBe("provider_preview");
    expect(response.match?.id).toBe(String(footballDataScheduledFixture.id));
    expect(response.prediction).not.toBeNull();
    expect(response.prediction?.sourceCount).toBe(0);
    expect(response.warning).toContain("not stored or frozen");
  });

  it("does not generate a preview prediction after kickoff", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          matches: [
            {
              ...footballDataLiveFixture,
              status: "IN_PLAY",
            },
          ],
        }),
      ),
    );

    const response = await loadProviderPreview(
      "test-key",
      new Date("2026-06-11T19:30:00.000Z"),
      1_000_000,
    );

    expect(response.state).toBe("in_progress");
    expect(response.prediction).toBeNull();
  });

  it("closes a selected match after kickoff even when provider status is delayed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          matches: [footballDataScheduledFixture],
        }),
      ),
    );

    const response = await loadProviderPreview(
      "test-key",
      new Date("2026-06-11T19:30:00.000Z"),
      1_000_000,
      String(footballDataScheduledFixture.id),
    );

    expect(response.state).toBe("in_progress");
    expect(response.prediction).toBeNull();
  });

  it("does not fabricate a draw when validated team history is unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (request: RequestInfo | URL) =>
        Response.json({
          matches: String(request).includes("/competitions/WC/matches")
            ? [footballDataScheduledFixture]
            : [],
        }),
      ),
    );

    const response = await loadProviderPreview(
      "test-key",
      new Date("2026-06-11T12:00:00.000Z"),
      1_000_000,
    );

    expect(response.state).toBe("not_ready");
    expect(response.prediction).toBeNull();
  });

  it("uses official FIFA rankings when provider history is sparse", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (request: RequestInfo | URL) => {
        const url = String(request);
        if (url.includes("api.fifa.com/api/v3/rankings")) {
          return Response.json(fifaRankings());
        }
        return Response.json({
          matches: url.includes("/competitions/WC/matches")
            ? [footballDataScheduledFixture]
            : [],
        });
      }),
    );

    const response = await loadProviderPreview(
      "test-key",
      new Date("2026-06-11T12:00:00.000Z"),
      1_000_000,
    );

    expect(response.prediction).toMatchObject({
      selectedOutcome: "team_a",
      sourceCount: 1,
    });
    expect(response.prediction?.predictedScoreA90).toBeGreaterThan(
      response.prediction?.predictedScoreB90 ?? Number.POSITIVE_INFINITY,
    );
  });

  it("selects a requested fixture and lists every match on its Eastern day", async () => {
    const second = {
      ...footballDataScheduledFixture,
      id: 2002,
      utcDate: "2026-06-12T01:00:00Z",
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async (request: RequestInfo | URL) => {
        if (String(request).includes("/competitions/WC/matches")) {
          return Response.json({
            matches: [footballDataScheduledFixture, second],
          });
        }
        return Response.json({ matches: completedHistory() });
      }),
    );

    const selected = await loadProviderPreview(
      "test-key",
      new Date("2026-06-11T12:00:00.000Z"),
      1_000_000,
      "2002",
    );
    const matches = await loadProviderDayMatches("test-key", second.utcDate);

    expect(selected.match?.id).toBe("2002");
    expect(matches.map(({ match }) => match.id)).toEqual(["2001", "2002"]);
  });

  it("shows the recorded Canada prediction beside its completed result", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          matches: [
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
          ],
        }),
      ),
    );

    const response = await loadProviderPreview(
      "test-key",
      new Date("2026-06-13T01:00:00.000Z"),
      30,
      "537333",
    );

    expect(response.state).toBe("finished");
    expect(response.result).toMatchObject({ scoreA90: 1, scoreB90: 1 });
    expect(response.prediction).toMatchObject({
      predictedScoreA90: 1,
      predictedScoreB90: 1,
      status: "frozen",
    });
    expect(await loadRecordedProviderHistory("test-key")).toHaveLength(1);
  });
});
