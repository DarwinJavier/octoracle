import { z } from "zod";

import { SupabaseFixtureRepository } from "@/lib/db/supabase-fixture-repository";
import { SupabasePredictionBuildRepository } from "@/lib/db/supabase-prediction-build-repository";
import { FootballDataFixtureProvider } from "@/lib/fixtures/providers/football-data";
import { syncFixtures } from "@/lib/fixtures/sync";
import { buildDuePredictions } from "@/lib/prediction/live";
import { freezeDuePredictions } from "@/lib/prediction/lifecycle";
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
  if (!isAuthorizedInternalRequest(request, secret)) {
    return json({ error: "unauthorized" }, 401);
  }

  const runKey = request.headers.get("idempotency-key");
  const parsedRunKey = idempotencyKeySchema.safeParse(runKey);
  if (!parsedRunKey.success) {
    return json({ error: "invalid_idempotency_key" }, 400);
  }
  if (isRateLimited(parsedRunKey.data)) {
    return json({ error: "rate_limited" }, 429);
  }

  const parsedBody = requestSchema.safeParse(
    await request.json().catch(() => ({})),
  );
  if (!parsedBody.success) {
    return json({ error: "invalid_request" }, 400);
  }

  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!apiKey || !supabaseUrl || !serviceRoleKey) {
    return json({ error: "service_not_configured" }, 503);
  }

  try {
    const provider = new FootballDataFixtureProvider({ apiKey });
    const result = await syncFixtures(
      provider,
      new SupabaseFixtureRepository({ supabaseUrl, serviceRoleKey }),
      parsedRunKey.data,
    );
    const predictionRepository = new SupabasePredictionBuildRepository({
      supabaseUrl,
      serviceRoleKey,
    });
    const predictionBuilds = await buildDuePredictions(
      provider,
      predictionRepository,
    );
    const predictionsFrozen = await freezeDuePredictions(predictionRepository);
    return json(
      { ...result, predictionBuilds, predictionsFrozen },
      result.status === "skipped" ? 200 : 201,
    );
  } catch (error) {
    console.error("fixture_sync_failed", {
      message: error instanceof Error ? error.message : "unknown_error",
    });
    return json({ error: "fixture_sync_failed" }, 502);
  }
}
