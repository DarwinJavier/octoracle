import { describe, expect, it } from "vitest";

import { POST } from "@/app/api/internal/research-match/route";

describe("protected research route", () => {
  it("rejects unauthenticated requests and exposes no public URL input", async () => {
    const response = await POST(
      new Request("https://example.test/api/internal/research-match", {
        method: "POST",
        body: JSON.stringify({ matchId: "not-used", url: "https://evil.test" }),
      }),
    );
    expect(response.status).toBe(401);
    expect(response.headers.has("access-control-allow-origin")).toBe(false);
  });

  it("rejects an authenticated caller attempting to supply a URL", async () => {
    const previousSecret = process.env.INTERNAL_CRON_SECRET;
    process.env.INTERNAL_CRON_SECRET = "research-secret";
    try {
      const response = await POST(
        new Request("https://example.test/api/internal/research-match", {
          method: "POST",
          headers: {
            Authorization: "Bearer research-secret",
            "Idempotency-Key": "research-run-001",
          },
          body: JSON.stringify({
            matchId: "00000000-0000-4000-8000-000000000001",
            teamA: "A",
            teamB: "B",
            url: "https://evil.test",
          }),
        }),
      );
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "invalid_request" });
    } finally {
      process.env.INTERNAL_CRON_SECRET = previousSecret;
    }
  });
});
