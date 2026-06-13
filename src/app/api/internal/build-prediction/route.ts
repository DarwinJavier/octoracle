import { z } from "zod";

import { SupabaseJobRepository } from "@/lib/db/supabase-job-repository";
import { SupabasePredictionBuildRepository } from "@/lib/db/supabase-prediction-build-repository";
import { FootballDataFixtureProvider } from "@/lib/fixtures/providers/football-data";
import { buildLivePrediction } from "@/lib/prediction/live";
import {
  idempotencyKeySchema,
  isAuthorizedInternalRequest,
  isRateLimited,
} from "@/lib/security/internal-job";

export const runtime = "nodejs";

const requestSchema = z
  .object({
    matchId: z.string().uuid(),
  })
  .strict();

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
  if (isRateLimited(`prediction:${runKey.data}`))
    return json({ error: "rate_limited" }, 429);
  const body = requestSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return json({ error: "invalid_request" }, 400);

  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!apiKey || !supabaseUrl || !serviceRoleKey)
    return json({ error: "service_not_configured" }, 503);

  const options = { supabaseUrl, serviceRoleKey };
  const jobs = new SupabaseJobRepository(options);
  try {
    if (await jobs.hasCompleted("build_prediction", runKey.data)) {
      return json({ status: "skipped", runKey: runKey.data }, 200);
    }
    return await jobs.withLock("build_prediction", async () => {
      if (await jobs.hasCompleted("build_prediction", runKey.data)) {
        return json({ status: "skipped", runKey: runKey.data }, 200);
      }
      const result = await buildLivePrediction(
        body.data.matchId,
        new FootballDataFixtureProvider({ apiKey }),
        new SupabasePredictionBuildRepository(options),
      );
      await jobs.record("build_prediction", runKey.data, "succeeded", 1);
      return json(
        {
          status: "succeeded",
          predictionId: result.prediction.id,
          version: result.prediction.version,
          selectedOutcome: result.prediction.selectedOutcome,
          historyMatchesRead: result.historyMatchesRead,
          sourceCount: result.sourceCount,
        },
        201,
      );
    });
  } catch (error) {
    await jobs
      .record("build_prediction", runKey.data, "failed", 0)
      .catch(() => undefined);
    console.error("prediction_build_failed", {
      message: error instanceof Error ? error.message : "unknown_error",
    });
    return json({ error: "prediction_build_failed" }, 502);
  }
}
