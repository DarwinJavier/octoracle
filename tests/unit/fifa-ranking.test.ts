import { describe, expect, it } from "vitest";

import {
  applyFifaRankingSignal,
  fifaRankingCodeFor,
  FifaRankingProvider,
  parseFifaRankingResponse,
} from "@/lib/prediction/signals/fifa-ranking";
import { calculateHistorySignals } from "@/lib/prediction/signals/history";
import {
  FIFA_RANKING_SNAPSHOT_DATE,
  fifaRankForCode,
} from "@/lib/fixtures/fifa-rankings";

const response = {
  Results: [
    {
      IdCountry: "AAA",
      Rank: 1,
      DecimalTotalPoints: 1900,
      DecimalPrevPoints: 1880,
      PubDate: "2026-06-11T10:00:00+00:00",
    },
    {
      IdCountry: "BBB",
      Rank: 100,
      DecimalTotalPoints: 1200,
      DecimalPrevPoints: 1210,
      PubDate: "2026-06-11T10:00:00+00:00",
    },
  ],
};

describe("FIFA ranking signals", () => {
  it("normalizes official points and recent point movement", () => {
    const rankings = parseFifaRankingResponse(response);

    expect(rankings.get("AAA")).toMatchObject({
      rank: 1,
      strength: 1,
      recentForm: 0.9,
    });
    expect(rankings.get("BBB")).toMatchObject({
      rank: 100,
      strength: 0,
      recentForm: 0.3,
    });
  });

  it("uses only the fixed official ranking endpoint with a six-hour cache", async () => {
    const requests: Array<{ url: string; init: RequestInit | undefined }> = [];
    const provider = new FifaRankingProvider(async (input, init) => {
      requests.push({ url: input.toString(), init });
      return Response.json(response);
    });

    await provider.fetchRankings();

    expect(requests).toHaveLength(1);
    expect(requests[0].url).toBe(
      "https://api.fifa.com/api/v3/rankings?locale=en&gender=1",
    );
    expect(requests[0].init?.cache).toBe("force-cache");
    expect(requests[0].init?.next?.revalidate).toBe(21_600);
  });

  it("supplies strength and ranking form when match history is sparse", () => {
    const ranking = parseFifaRankingResponse(response).get("AAA")!;
    const signals = applyFifaRankingSignal(
      calculateHistorySignals("team-a", []),
      ranking,
      false,
    );

    expect(signals.longTermStrength).toBe(1);
    expect(signals.recentForm).toBe(0.9);
    expect(signals.attackingPerformance).toBe(0.5);
    expect(signals.defensivePerformance).toBe(0.5);
  });

  it("rejects malformed ranking responses", () => {
    expect(() =>
      parseFifaRankingResponse({ Results: [{ Rank: "first" }] }),
    ).toThrow();
  });

  it("maps provider-specific Uruguay code to FIFA's ranking code", () => {
    expect(fifaRankingCodeFor("URY")).toBe("URU");
    expect(fifaRankingCodeFor("KSA")).toBe("KSA");
    expect(fifaRankingCodeFor(null)).toBeNull();
  });

  it("keeps the supplied tournament ranking snapshot available to the UI", () => {
    expect(FIFA_RANKING_SNAPSHOT_DATE).toBe("2026-06-11");
    expect(fifaRankForCode("BEL")).toBe(9);
    expect(fifaRankForCode("URY")).toBe(16);
    expect(fifaRankForCode("TBD")).toBeNull();
  });
});
