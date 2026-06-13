import { describe, expect, it } from "vitest";

import { SupabaseSourceObservationRepository } from "@/lib/db/supabase-source-observation-repository";
import { sourceObservation } from "../fixtures/source-observation";

describe("source observation persistence", () => {
  it("persists only validated observations through an idempotent upsert", async () => {
    let requestUrl = "";
    let requestBody = "";
    const repository = new SupabaseSourceObservationRepository({
      supabaseUrl: "https://project.supabase.co",
      serviceRoleKey: "service-role",
      fetchImplementation: async (input, init) => {
        requestUrl = input.toString();
        requestBody = String(init?.body);
        return new Response(null, { status: 201 });
      },
    });
    expect(await repository.saveObservations([sourceObservation()])).toBe(1);
    expect(requestUrl).toContain(
      "on_conflict=match_id,source_domain,content_hash",
    );
    const persisted = JSON.parse(requestBody) as Array<Record<string, unknown>>;
    expect(persisted[0]).not.toHaveProperty("text");
    expect(persisted[0]).not.toHaveProperty("command");
  });

  it("rejects an observation with unknown fields before persistence", async () => {
    const repository = new SupabaseSourceObservationRepository({
      supabaseUrl: "https://project.supabase.co",
      serviceRoleKey: "service-role",
      fetchImplementation: async () => {
        throw new Error("must not fetch");
      },
    });
    await expect(
      repository.saveObservations([
        { ...sourceObservation(), command: "publish" } as never,
      ]),
    ).rejects.toThrow();
  });
});
