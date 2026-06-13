import { z } from "zod";

import { FootballDataFixtureProvider } from "@/lib/fixtures/providers/football-data";
import { SupabaseJobRepository } from "@/lib/db/supabase-job-repository";
import { SupabaseResultRepository } from "@/lib/db/supabase-result-repository";
import { syncResults } from "@/lib/results/service";
import {
  idempotencyKeySchema,
  isAuthorizedInternalRequest,
  isRateLimited,
} from "@/lib/security/internal-job";

export const runtime = "nodejs";
const requestSchema = z.object({}).strict();

function json(body: unknown, status: number) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  const secret = process.env.INTERNAL_CRON_SECRET ?? "";
  if (!isAuthorizedInternalRequest(request, secret))
    return json({ error: "unauthorized" }, 401);
  const runKey = idempotencyKeySchema.safeParse(
    request.headers.get("idempotency-key"),
  );
  if (!runKey.success) return json({ error: "invalid_idempotency_key" }, 400);
  if (isRateLimited(`results:${runKey.data}`))
    return json({ error: "rate_limited" }, 429);
  const body = requestSchema.safeParse(await request.json().catch(() => ({})));
  if (!body.success) return json({ error: "invalid_request" }, 400);

  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!apiKey || !supabaseUrl || !serviceRoleKey)
    return json({ error: "service_not_configured" }, 503);

  const options = { supabaseUrl, serviceRoleKey };
  const jobs = new SupabaseJobRepository(options);
  try {
    if (await jobs.hasCompleted("sync_results", runKey.data)) {
      return json({ status: "skipped", runKey: runKey.data }, 200);
    }
    return await jobs.withLock("sync_results", async () => {
      if (await jobs.hasCompleted("sync_results", runKey.data)) {
        return json({ status: "skipped", runKey: runKey.data }, 200);
      }
      const result = await syncResults(
        await new FootballDataFixtureProvider({ apiKey }).fetchFixtures(),
        new SupabaseResultRepository(options),
      );
      await jobs.record(
        "sync_results",
        runKey.data,
        "succeeded",
        result.recordsWritten,
      );
      return json({ status: "succeeded", ...result }, 200);
    });
  } catch (error) {
    await jobs
      .record("sync_results", runKey.data, "failed", 0)
      .catch(() => undefined);
    console.error("result_sync_failed", {
      message: error instanceof Error ? error.message : "unknown_error",
    });
    return json({ error: "result_sync_failed" }, 502);
  }
}
