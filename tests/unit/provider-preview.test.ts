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
import {
  recordedPreviewPredictionFor,
  recordedPreviewPredictionsForEasternDay,
  recordedPreviewPredictionIds,
} from "@/lib/prediction/preview-ledger";

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
        "537327",
        "537328",
        "537333",
        "537345",
        "537334",
        "537339",
        "537340",
        "537346",
        "537351",
        "537357",
        "537352",
        "537358",
        "537369",
        "537363",
        "537370",
        "537364",
        "537391",
        "537397",
        "537403",
        "537409",
        "537410",
        "537404",
        "537329",
        "537335",
        "537336",
        "537330",
        "537359",
        "537353",
        "537354",
        "537360",
        "537392",
        "537371",
        "537365",
        "537372",
        "537366",
        "537399",
        "537393",
        "537394",
        "537400",
        "537405",
        "537411",
        "537412",
        "537406",
      ]),
    );
  });

  it("keeps June 22 source-backed forecasts and UI criteria", () => {
    expect(recordedPreviewPredictionFor("537399")).toMatchObject({
      predictedScoreA90: 2,
      predictedScoreB90: 1,
      selectedOutcome: "team_a",
      confidence: "high",
      reasonCodes: expect.arrayContaining([
        "Opta: Argentina 65.4%",
        "Austria pressing and set pieces",
      ]),
    });
    expect(recordedPreviewPredictionFor("537393")).toMatchObject({
      predictedScoreA90: 3,
      predictedScoreB90: 0,
      selectedOutcome: "team_a",
      confidence: "high",
      reasonCodes: expect.arrayContaining(["Opta: France 88.8%"]),
    });
    expect(recordedPreviewPredictionFor("537394")).toMatchObject({
      predictedScoreA90: 2,
      predictedScoreB90: 1,
      selectedOutcome: "team_a",
      confidence: "low",
      publicExplanation: expect.stringContaining("low-medium-confidence"),
      reasonCodes: expect.arrayContaining(["Opta: Norway 44.7%"]),
    });
    expect(recordedPreviewPredictionFor("537400")).toMatchObject({
      predictedScoreA90: 0,
      predictedScoreB90: 2,
      selectedOutcome: "team_b",
      confidence: "high",
      reasonCodes: expect.arrayContaining([
        "Opta: Algeria 60.7%",
        "Jordan compact and physical",
      ]),
    });
  });

  it("keeps June 23 source-backed forecasts and UI criteria", () => {
    expect(recordedPreviewPredictionFor("537405")).toMatchObject({
      predictedScoreA90: 2,
      predictedScoreB90: 0,
      selectedOutcome: "team_a",
      confidence: "high",
      reasonCodes: expect.arrayContaining([
        "Opta: Portugal 78.0%",
        "Uzbekistan 1.16 xG debut",
      ]),
    });
    expect(recordedPreviewPredictionFor("537411")).toMatchObject({
      predictedScoreA90: 3,
      predictedScoreB90: 1,
      selectedOutcome: "team_a",
      confidence: "high",
      reasonCodes: expect.arrayContaining([
        "Opta: England 78.8%",
        "Ghana counterattack threat",
      ]),
    });
    expect(recordedPreviewPredictionFor("537412")).toMatchObject({
      predictedScoreA90: 0,
      predictedScoreB90: 2,
      selectedOutcome: "team_b",
      confidence: "high",
      publicExplanation: expect.stringContaining("medium-high"),
      reasonCodes: expect.arrayContaining([
        "Opta: Croatia 63.0%",
        "Croatia high-pressure bounce-back",
      ]),
    });
    expect(recordedPreviewPredictionFor("537406")).toMatchObject({
      predictedScoreA90: 2,
      predictedScoreB90: 1,
      selectedOutcome: "team_a",
      confidence: "medium",
      reasonCodes: expect.arrayContaining([
        "Opta: Colombia 58.0%",
        "Congo DR held Portugal",
      ]),
    });
  });

  it("preserves the restored initial forecasts", () => {
    expect(recordedPreviewPredictionFor("537327")).toMatchObject({
      predictedScoreA90: 1,
      predictedScoreB90: 0,
      selectedOutcome: "team_a",
      status: "frozen",
    });
    expect(recordedPreviewPredictionFor("537328")).toMatchObject({
      predictedScoreA90: 1,
      predictedScoreB90: 0,
      selectedOutcome: "team_a",
      status: "frozen",
    });
    expect(recordedPreviewPredictionFor("537392")).toMatchObject({
      predictedScoreA90: 0,
      predictedScoreB90: 1,
      selectedOutcome: "team_b",
      status: "frozen",
    });
    expect(recordedPreviewPredictionFor("537371")).toMatchObject({
      predictedScoreA90: 3,
      predictedScoreB90: 1,
      selectedOutcome: "team_a",
      status: "frozen",
    });
    expect(recordedPreviewPredictionFor("537365")).toMatchObject({
      predictedScoreA90: 1,
      predictedScoreB90: 1,
      selectedOutcome: "draw",
      status: "frozen",
    });
    expect(recordedPreviewPredictionFor("537372")).toMatchObject({
      predictedScoreA90: 1,
      predictedScoreB90: 0,
      selectedOutcome: "team_a",
      status: "frozen",
    });
    expect(recordedPreviewPredictionFor("537366")).toMatchObject({
      predictedScoreA90: 0,
      predictedScoreB90: 1,
      selectedOutcome: "team_b",
      status: "frozen",
    });
  });

  it("keeps today's reviewed forecasts in a private daily recovery table", () => {
    expect(
      recordedPreviewPredictionsForEasternDay("2026-06-15").map(
        ({ matchProviderId, prediction }) => ({
          matchProviderId,
          score: `${prediction.predictedScoreA90}-${prediction.predictedScoreB90}`,
          outcome: prediction.selectedOutcome,
        }),
      ),
    ).toEqual(
      expect.arrayContaining([
        { matchProviderId: "537369", score: "3-0", outcome: "team_a" },
        { matchProviderId: "537363", score: "0-0", outcome: "draw" },
        { matchProviderId: "537370", score: "0-2", outcome: "team_b" },
        { matchProviderId: "537364", score: "1-1", outcome: "draw" },
      ]),
    );
  });

  it("preserves corrected predictions from the reviewed log", () => {
    expect(recordedPreviewPredictionFor("537345")).toMatchObject({
      predictedScoreA90: 2,
      predictedScoreB90: 1,
      selectedOutcome: "team_a",
      status: "frozen",
      version: 2,
    });
    expect(recordedPreviewPredictionFor("537357")).toMatchObject({
      predictedScoreA90: 2,
      predictedScoreB90: 2,
      selectedOutcome: "draw",
      status: "frozen",
      version: 2,
    });
    expect(recordedPreviewPredictionFor("537363")).toMatchObject({
      predictedScoreA90: 0,
      predictedScoreB90: 0,
      selectedOutcome: "draw",
      status: "frozen",
      version: 3,
    });
    expect(recordedPreviewPredictionFor("537364")).toMatchObject({
      predictedScoreA90: 1,
      predictedScoreB90: 1,
      selectedOutcome: "draw",
      status: "frozen",
      version: 3,
    });
  });

  it("keeps June 16 reviewed forecasts in the private daily recovery table", () => {
    expect(
      recordedPreviewPredictionsForEasternDay("2026-06-16").map(
        ({ matchProviderId, prediction }) => ({
          matchProviderId,
          score: `${prediction.predictedScoreA90}-${prediction.predictedScoreB90}`,
          outcome: prediction.selectedOutcome,
        }),
      ),
    ).toEqual(
      expect.arrayContaining([
        { matchProviderId: "537391", score: "2-0", outcome: "team_a" },
        { matchProviderId: "537397", score: "2-0", outcome: "team_a" },
      ]),
    );
  });

  it("keeps June 17 reviewed forecasts in the private daily recovery table", () => {
    expect(
      recordedPreviewPredictionsForEasternDay("2026-06-17").map(
        ({ matchProviderId, prediction }) => ({
          matchProviderId,
          score: `${prediction.predictedScoreA90}-${prediction.predictedScoreB90}`,
          outcome: prediction.selectedOutcome,
        }),
      ),
    ).toEqual(
      expect.arrayContaining([
        { matchProviderId: "537403", score: "2-0", outcome: "team_a" },
        { matchProviderId: "537409", score: "1-1", outcome: "draw" },
        { matchProviderId: "537410", score: "0-1", outcome: "team_b" },
        { matchProviderId: "537404", score: "0-2", outcome: "team_b" },
      ]),
    );
  });

  it("keeps June 18 reviewed forecasts in the private daily recovery table", () => {
    expect(
      recordedPreviewPredictionsForEasternDay("2026-06-18").map(
        ({ matchProviderId, prediction }) => ({
          matchProviderId,
          score: `${prediction.predictedScoreA90}-${prediction.predictedScoreB90}`,
          outcome: prediction.selectedOutcome,
        }),
      ),
    ).toEqual(
      expect.arrayContaining([
        { matchProviderId: "537329", score: "1-1", outcome: "draw" },
        { matchProviderId: "537336", score: "1-0", outcome: "team_a" },
        { matchProviderId: "537335", score: "2-0", outcome: "team_a" },
        { matchProviderId: "537330", score: "1-0", outcome: "team_a" },
      ]),
    );
  });

  it("keeps June 19 reviewed forecasts in the private daily recovery table", () => {
    expect(
      recordedPreviewPredictionsForEasternDay("2026-06-19").map(
        ({ matchProviderId, prediction }) => ({
          matchProviderId,
          score: `${prediction.predictedScoreA90}-${prediction.predictedScoreB90}`,
          outcome: prediction.selectedOutcome,
        }),
      ),
    ).toEqual(
      expect.arrayContaining([
        { matchProviderId: "537348", score: "1-0", outcome: "team_a" },
        { matchProviderId: "537342", score: "0-1", outcome: "team_b" },
        { matchProviderId: "537341", score: "2-0", outcome: "team_a" },
        { matchProviderId: "537347", score: "1-0", outcome: "team_a" },
      ]),
    );
  });

  it("keeps June 20 slate forecasts and app-ready explanations", () => {
    expect(
      recordedPreviewPredictionsForEasternDay("2026-06-20").map(
        ({ matchProviderId, prediction }) => ({
          matchProviderId,
          score: `${prediction.predictedScoreA90}-${prediction.predictedScoreB90}`,
          outcome: prediction.selectedOutcome,
        }),
      ),
    ).toEqual(
      expect.arrayContaining([
        { matchProviderId: "537359", score: "2-1", outcome: "team_a" },
        { matchProviderId: "537353", score: "2-1", outcome: "team_a" },
        { matchProviderId: "537354", score: "2-0", outcome: "team_a" },
      ]),
    );

    expect(recordedPreviewPredictionFor("537359")).toMatchObject({
      confidence: "medium",
      publicExplanation: expect.stringContaining(
        "medium-confidence pick rather than a safe call",
      ),
      reasonCodes: expect.arrayContaining(["Opta via Al Jazeera"]),
    });
    expect(recordedPreviewPredictionFor("537353")).toMatchObject({
      confidence: "medium",
      publicExplanation: expect.stringContaining(
        "medium-to-low-confidence pick",
      ),
    });
    expect(recordedPreviewPredictionFor("537354")).toMatchObject({
      confidence: "high",
      publicExplanation: expect.stringContaining("86.1% win probability"),
    });
    expect(recordedPreviewPredictionFor("537360")).toMatchObject({
      confidence: "high",
      predictedScoreA90: 0,
      predictedScoreB90: 2,
      selectedOutcome: "team_b",
      publicExplanation: expect.stringContaining("medium-high-confidence pick"),
    });
  });

  it("preserves the revealed Sweden one-nil prediction", () => {
    expect(recordedPreviewPredictionFor("537358")).toMatchObject({
      predictedScoreA90: 1,
      predictedScoreB90: 0,
      selectedOutcome: "team_a",
      status: "frozen",
    });
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

  it("uses Uruguay's official ranking despite the provider-specific URY code", async () => {
    const saudiUruguay = {
      ...footballDataScheduledFixture,
      id: 537370,
      homeTeam: {
        ...footballDataScheduledFixture.homeTeam,
        id: 801,
        name: "Saudi Arabia",
        shortName: "Saudi Arabia",
        tla: "KSA",
      },
      awayTeam: {
        ...footballDataScheduledFixture.awayTeam,
        id: 758,
        name: "Uruguay",
        shortName: "Uruguay",
        tla: "URY",
      },
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async (request: RequestInfo | URL) => {
        const url = String(request);
        if (url.includes("api.fifa.com/api/v3/rankings")) {
          return Response.json({
            Results: [
              {
                IdCountry: "URU",
                Rank: 16,
                DecimalTotalPoints: 1673,
                DecimalPrevPoints: 1673,
                PubDate: "2026-06-11T10:00:00+00:00",
              },
              {
                IdCountry: "KSA",
                Rank: 61,
                DecimalTotalPoints: 1424,
                DecimalPrevPoints: 1421,
                PubDate: "2026-06-11T10:00:00+00:00",
              },
            ],
          });
        }
        return Response.json({
          matches: url.includes("/competitions/WC/matches")
            ? [saudiUruguay]
            : [],
        });
      }),
    );

    const response = await loadProviderPreview(
      "test-key",
      new Date("2026-06-11T12:00:00.000Z"),
      1_000_000,
    );

    expect(response.state).toBe("upcoming");
    expect(response.prediction).toMatchObject({
      selectedOutcome: "team_b",
      predictedScoreA90: 0,
      predictedScoreB90: 2,
    });
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
