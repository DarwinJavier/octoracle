import { z } from "zod";

import { createSupabaseServerHeaders } from "@/lib/db/supabase-auth";
import type { PredictionRepository } from "@/lib/prediction/lifecycle";
import type { BuiltPrediction, StoredPrediction } from "@/lib/prediction/types";

const storedPredictionSchema = z
  .object({
    id: z.string().uuid(),
    match_id: z.string(),
    version: z.number().int().positive(),
    status: z.enum(["draft", "published", "frozen", "superseded", "void"]),
    generated_at: z.string().datetime({ offset: true }),
    frozen_at: z.string().datetime({ offset: true }).nullable(),
  })
  .passthrough();

type Options = {
  supabaseUrl: string;
  serviceRoleKey: string;
  fetchImplementation?: typeof fetch;
};

export class SupabasePredictionRepository implements PredictionRepository {
  private readonly fetchImplementation: typeof fetch;
  private readonly restUrl: string;

  constructor(private readonly options: Options) {
    this.fetchImplementation = options.fetchImplementation ?? fetch;
    this.restUrl = `${options.supabaseUrl.replace(/\/$/, "")}/rest/v1`;
  }

  private async rpc(functionName: string, body: unknown) {
    const response = await this.fetchImplementation(
      `${this.restUrl}/rpc/${functionName}`,
      {
        method: "POST",
        headers: createSupabaseServerHeaders(this.options.serviceRoleKey),
        body: JSON.stringify(body),
        cache: "no-store",
      },
    );
    if (!response.ok)
      throw new Error(
        `Prediction repository RPC failed with status ${response.status}`,
      );
    return response;
  }

  async publishVersion(prediction: BuiltPrediction, generatedAt: string) {
    const response = await this.rpc("publish_prediction_version", {
      prediction_payload: {
        ...prediction,
        generatedAt,
      },
    });
    const row = storedPredictionSchema.parse(await response.json());
    return {
      ...prediction,
      id: row.id,
      version: row.version,
      status: row.status,
      generatedAt: row.generated_at,
      frozenAt: row.frozen_at,
    } satisfies StoredPrediction;
  }

  async freezeDue(now: string) {
    const response = await this.rpc("freeze_due_predictions", {
      freeze_time: now,
    });
    return z
      .number()
      .int()
      .nonnegative()
      .parse(await response.json());
  }

  async voidFrozenForMatch(matchId: string) {
    const response = await this.rpc("void_frozen_predictions_for_match", {
      target_match_id: matchId,
    });
    return z
      .number()
      .int()
      .nonnegative()
      .parse(await response.json());
  }
}
