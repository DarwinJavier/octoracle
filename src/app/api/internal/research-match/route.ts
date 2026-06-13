import { z } from "zod";

import { SupabaseJobRepository } from "@/lib/db/supabase-job-repository";
import { SupabaseSourceObservationRepository } from "@/lib/db/supabase-source-observation-repository";
import { AllowlistedResearchFetcher } from "@/lib/research/fetcher";
import { researchConfigFromEnvironment } from "@/lib/research/config";
import { calculateConsensus } from "@/lib/research/consensus";
import { OpenAIObservationExtractor } from "@/lib/research/extractor";
import { researchMatch } from "@/lib/research/pipeline";
import {
  idempotencyKeySchema,
  isAuthorizedInternalRequest,
  isRateLimited,
} from "@/lib/security/internal-job";

export const runtime = "nodejs";

const requestSchema = z
  .object({
    matchId: z.string().uuid(),
    teamA: z.string().min(1).max(100),
    teamB: z.string().min(1).max(100),
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
  if (isRateLimited(`research:${runKey.data}`))
    return json({ error: "rate_limited" }, 429);
  const body = requestSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return json({ error: "invalid_request" }, 400);

  const config = researchConfigFromEnvironment();
  if (
    config.allowedDomains.length === 0 ||
    config.sourceUrls.length === 0 ||
    !config.openAiApiKey ||
    !config.openAiModel ||
    !process.env.SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return json({ error: "research_not_configured" }, 503);
  }

  try {
    const options = {
      supabaseUrl: process.env.SUPABASE_URL,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    };
    const jobs = new SupabaseJobRepository(options);
    if (await jobs.hasCompleted("research_match", runKey.data)) {
      return json({ status: "skipped", runKey: runKey.data }, 200);
    }
    return await jobs.withLock("research_match", async () => {
      if (await jobs.hasCompleted("research_match", runKey.data)) {
        return json({ status: "skipped", runKey: runKey.data }, 200);
      }
      try {
        const observations = await researchMatch(
          {
            id: body.data.matchId,
            teamA: body.data.teamA,
            teamB: body.data.teamB,
          },
          config.sourceUrls.map((url) => ({ url })),
          new AllowlistedResearchFetcher({
            allowedDomains: config.allowedDomains,
          }),
          new OpenAIObservationExtractor({
            apiKey: config.openAiApiKey,
            model: config.openAiModel,
          }),
          { parser: "plain-text-1.0.0", model: config.openAiModel },
        );
        const consensus = calculateConsensus(observations);
        const recordsWritten = await new SupabaseSourceObservationRepository(
          options,
        ).saveObservations(observations);
        await jobs.record(
          "research_match",
          runKey.data,
          "succeeded",
          recordsWritten,
        );
        return json({ observations, consensus, recordsWritten }, 200);
      } catch (error) {
        await jobs
          .record("research_match", runKey.data, "failed", 0)
          .catch(() => undefined);
        throw error;
      }
    });
  } catch {
    return json({ error: "research_failed" }, 502);
  }
}
