import { afterEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/teams/[teamId]/flag/route";

describe("team flag route", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.FOOTBALL_DATA_API_KEY;
  });

  it("proxies only a validated football-data.org crest", async () => {
    process.env.FOOTBALL_DATA_API_KEY = "test-key";
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          Response.json({
            crest: "https://crests.football-data.org/canada.svg",
          }),
        )
        .mockResolvedValueOnce(
          new Response(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2 1"><path fill="red" d="M0 0h2v1H0z"/></svg>',
            {
              headers: { "content-type": "image/svg+xml" },
            },
          ),
        ),
    );

    const response = await GET(new Request("https://example.test"), {
      params: Promise.resolve({ teamId: "5529" }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(response.headers.get("content-security-policy")).toBe("sandbox");
  });

  it("rejects invalid team IDs", async () => {
    process.env.FOOTBALL_DATA_API_KEY = "test-key";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(new Request("https://example.test"), {
      params: Promise.resolve({ teamId: "https://evil.test" }),
    });

    expect(response.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
