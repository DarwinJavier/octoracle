import { describe, expect, it, vi } from "vitest";

import { SupabaseFixtureRepository } from "@/lib/db/supabase-fixture-repository";
import { SupabasePredictionBuildRepository } from "@/lib/db/supabase-prediction-build-repository";

const matchId = "00000000-0000-4000-8000-000000000001";

describe("reviewed prediction database backfill", () => {
  it("inserts a missing reviewed prediction as a frozen auditable record", async () => {
    const fetchImplementation = vi.fn(
      async (request: RequestInfo | URL, init?: RequestInit) => {
        const url = String(request);
        if (url.includes("/matches?select=id,provider_id")) {
          return Response.json([{ id: matchId, provider_id: "537357" }]);
        }
        if (url.includes("/predictions?select=match_id")) {
          return Response.json([]);
        }
        if (url.endsWith("/predictions") && init?.method === "POST") {
          return new Response(null, { status: 201 });
        }
        throw new Error(`Unexpected request: ${url}`);
      },
    );
    const repository = new SupabaseFixtureRepository({
      supabaseUrl: "https://supabase.test",
      serviceRoleKey: "service-key",
      fetchImplementation,
    });

    expect(await repository.backfillRecordedPredictions()).toBe(1);
    const insert = fetchImplementation.mock.calls.find(
      ([request, init]) =>
        String(request).endsWith("/predictions") && init?.method === "POST",
    );
    expect(JSON.parse(String(insert?.[1]?.body))).toEqual([
      expect.objectContaining({
        match_id: matchId,
        predicted_score_a_90: 2,
        predicted_score_b_90: 2,
        selected_outcome: "draw",
        status: "frozen",
        version: 2,
      }),
    ]);
  });

  it("does not rewrite the already stored reviewed version", async () => {
    const fetchImplementation = vi.fn(async (request: RequestInfo | URL) => {
      const url = String(request);
      if (url.includes("/matches?select=id,provider_id")) {
        return Response.json([{ id: matchId, provider_id: "537357" }]);
      }
      if (url.includes("/predictions?select=match_id")) {
        return Response.json([
          {
            match_id: matchId,
            version: 2,
            status: "frozen",
            input_snapshot_hash: "reviewed-preview:537357:v2",
          },
        ]);
      }
      throw new Error(`Unexpected request: ${url}`);
    });
    const repository = new SupabaseFixtureRepository({
      supabaseUrl: "https://supabase.test",
      serviceRoleKey: "service-key",
      fetchImplementation,
    });

    expect(await repository.backfillRecordedPredictions()).toBe(0);
    expect(fetchImplementation).toHaveBeenCalledTimes(2);
  });

  it("adds a corrected reviewed version and voids older frozen history", async () => {
    const fetchImplementation = vi.fn(
      async (request: RequestInfo | URL, init?: RequestInit) => {
        const url = String(request);
        if (url.includes("/matches?select=id,provider_id")) {
          return Response.json([{ id: matchId, provider_id: "537357" }]);
        }
        if (url.includes("/predictions?select=match_id")) {
          return Response.json([
            {
              match_id: matchId,
              version: 1,
              status: "frozen",
              input_snapshot_hash: "reviewed-preview:537357:v1",
            },
          ]);
        }
        if (url.endsWith("/predictions") && init?.method === "POST") {
          return new Response(null, { status: 201 });
        }
        if (
          url.includes("/predictions?match_id=eq.") &&
          init?.method === "PATCH"
        ) {
          return new Response(null, { status: 204 });
        }
        throw new Error(`Unexpected request: ${url}`);
      },
    );
    const repository = new SupabaseFixtureRepository({
      supabaseUrl: "https://supabase.test",
      serviceRoleKey: "service-key",
      fetchImplementation,
    });

    expect(await repository.backfillRecordedPredictions()).toBe(1);
    const insert = fetchImplementation.mock.calls.find(
      ([request, init]) =>
        String(request).endsWith("/predictions") && init?.method === "POST",
    );
    expect(JSON.parse(String(insert?.[1]?.body))).toEqual([
      expect.objectContaining({
        match_id: matchId,
        predicted_score_a_90: 2,
        predicted_score_b_90: 2,
        selected_outcome: "draw",
        version: 2,
      }),
    ]);
    const patch = fetchImplementation.mock.calls.find(
      ([request, init]) =>
        String(request).includes("status=eq.frozen") &&
        init?.method === "PATCH",
    );
    expect(String(patch?.[0])).toContain("version=lt.2");
    expect(JSON.parse(String(patch?.[1]?.body))).toEqual({ status: "void" });
  });
});

describe("automatic prediction build candidates", () => {
  it("selects missing and stale predictions but skips a recently generated one", async () => {
    const missingId = "00000000-0000-4000-8000-000000000011";
    const staleId = "00000000-0000-4000-8000-000000000012";
    const freshId = "00000000-0000-4000-8000-000000000013";
    const fetchImplementation = vi.fn(async (request: RequestInfo | URL) => {
      const url = String(request);
      if (url.includes("/matches?select=id")) {
        return Response.json([
          { id: missingId },
          { id: staleId },
          { id: freshId },
        ]);
      }
      if (url.includes("/predictions?select=match_id,generated_at")) {
        return Response.json([
          {
            match_id: freshId,
            generated_at: "2026-06-15T11:00:00.000Z",
          },
          {
            match_id: staleId,
            generated_at: "2026-06-15T08:00:00.000Z",
          },
        ]);
      }
      throw new Error(`Unexpected request: ${url}`);
    });
    const repository = new SupabasePredictionBuildRepository({
      supabaseUrl: "https://supabase.test",
      serviceRoleKey: "service-key",
      fetchImplementation,
    });

    await expect(
      repository.listPredictionBuildCandidates(
        new Date("2026-06-15T12:00:00.000Z"),
        48,
        3,
      ),
    ).resolves.toEqual([missingId, staleId]);
  });
});
