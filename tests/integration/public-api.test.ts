import { describe, expect, it } from "vitest";

import { GET as getHealth } from "@/app/api/health/route";
import { GET as getMatch } from "@/app/api/matches/[matchId]/route";
import { GET as getPrediction } from "@/app/api/matches/[matchId]/prediction/route";
import { GET as getNextMatch } from "@/app/api/matches/next/route";
import { GET as getHistory } from "@/app/api/predictions/history/route";
import {
  featuredMatchResponseSchema,
  predictionResponseSchema,
  publicMatchSchema,
} from "@/types/public";

describe("read-only public APIs", () => {
  it("returns a strict featured-match response without write methods", async () => {
    const response = await getNextMatch();
    expect(response.status).toBe(200);
    expect(
      featuredMatchResponseSchema.parse(await response.json()).dataSource,
    ).toBe("demo");
    expect(response.headers.get("cache-control")).toContain(
      "stale-while-revalidate",
    );
  });

  it("returns a healthy read-only service response", async () => {
    const response = await getHealth();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: "ok" });
  });

  it("returns strict match and prediction responses by match ID", async () => {
    const context = {
      params: Promise.resolve({ matchId: "static-opening-match" }),
    };
    const match = await getMatch(new Request("https://example.test"), context);
    const prediction = await getPrediction(
      new Request("https://example.test"),
      context,
    );
    expect(publicMatchSchema.parse(await match.json()).id).toBe(
      "static-opening-match",
    );
    expect(
      predictionResponseSchema.parse(await prediction.json()).prediction
        ?.version,
    ).toBe(1);
  });

  it("returns a validated immutable prediction history response", async () => {
    const response = await getHistory(
      new Request("https://example.test/api/predictions/history?limit=20"),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ items: [], total: 0 });
  });
});
