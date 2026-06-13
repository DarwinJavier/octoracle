import { describe, expect, it } from "vitest";

import { POST } from "@/app/api/internal/sync-fixtures/route";

describe("internal fixture sync route", () => {
  it("rejects an unauthenticated write before touching provider or database configuration", async () => {
    const response = await POST(
      new Request("https://example.test/api/internal/sync-fixtures", {
        method: "POST",
        body: "{}",
      }),
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "unauthorized" });
    expect(response.headers.has("access-control-allow-origin")).toBe(false);
  });
});
