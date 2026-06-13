import { describe, expect, it } from "vitest";

import { SupabaseResultRepository } from "@/lib/db/supabase-result-repository";

describe("result repository", () => {
  it("uses the transactional audited result RPC and reports changed rows", async () => {
    let requestUrl = "";
    const repository = new SupabaseResultRepository({
      supabaseUrl: "https://project.supabase.co",
      serviceRoleKey: "service-role",
      fetchImplementation: async (input) => {
        requestUrl = input.toString();
        return Response.json(true);
      },
    });
    const written = await repository.applyResults([
      {
        matchProviderId: "match-1",
        status: "finished",
        scoreA90: 2,
        scoreB90: 1,
        scoreAFinal: 2,
        scoreBFinal: 1,
        winnerProviderTeamId: "a",
        providerUpdatedAt: "2026-06-11T21:00:00.000Z",
      },
    ]);
    expect(written).toBe(1);
    expect(requestUrl).toContain("/rpc/apply_match_result");
  });
});
