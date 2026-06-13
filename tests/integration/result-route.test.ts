import { describe, expect, it } from "vitest";

import { POST } from "@/app/api/internal/sync-results/route";

describe("protected result sync route", () => {
  it("rejects unauthenticated result writes", async () => {
    const response = await POST(
      new Request("https://example.test/api/internal/sync-results", {
        method: "POST",
        body: "{}",
      }),
    );
    expect(response.status).toBe(401);
    expect(response.headers.has("access-control-allow-origin")).toBe(false);
  });
});
