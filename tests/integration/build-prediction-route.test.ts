import { describe, expect, it } from "vitest";

import { POST } from "@/app/api/internal/build-prediction/route";

describe("protected prediction build route", () => {
  it("rejects unauthenticated prediction publication", async () => {
    const response = await POST(
      new Request("https://example.test/api/internal/build-prediction", {
        method: "POST",
        body: JSON.stringify({
          matchId: "00000000-0000-4000-8000-000000000001",
        }),
      }),
    );
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "unauthorized" });
    expect(response.headers.has("access-control-allow-origin")).toBe(false);
  });

  it("rejects unknown request fields before configuration access", async () => {
    const previousSecret = process.env.INTERNAL_CRON_SECRET;
    process.env.INTERNAL_CRON_SECRET = "prediction-secret";
    try {
      const response = await POST(
        new Request("https://example.test/api/internal/build-prediction", {
          method: "POST",
          headers: {
            Authorization: "Bearer prediction-secret",
            "Idempotency-Key": "prediction-build-001",
          },
          body: JSON.stringify({
            matchId: "00000000-0000-4000-8000-000000000001",
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
