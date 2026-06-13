import { describe, expect, it } from "vitest";

import { SupabaseJobRepository } from "@/lib/db/supabase-job-repository";

describe("research job coordination", () => {
  it("checks completed runs and acquires an expiring database lock", async () => {
    const requests: Array<{ method: string; url: string }> = [];
    const repository = new SupabaseJobRepository({
      supabaseUrl: "https://project.supabase.co",
      serviceRoleKey: "service-role",
      fetchImplementation: async (input, init) => {
        requests.push({ method: init?.method ?? "GET", url: input.toString() });
        if (input.toString().includes("job_runs?select=id"))
          return Response.json([]);
        return new Response(null, { status: 204 });
      },
    });
    expect(await repository.hasCompleted("research_match", "run-001")).toBe(
      false,
    );
    expect(
      await repository.withLock("research_match", async () => "done"),
    ).toBe("done");
    expect(
      requests.some(
        (request) =>
          request.method === "POST" && request.url.endsWith("job_locks"),
      ),
    ).toBe(true);
    expect(
      requests.filter((request) => request.method === "DELETE"),
    ).toHaveLength(2);
  });
});
