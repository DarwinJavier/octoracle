import { z } from "zod";

import { createSupabaseServerHeaders } from "@/lib/db/supabase-auth";
import { calculatePredictionAccuracy } from "@/lib/results/service";
import { finalResultSchema } from "@/lib/results/types";
import type { PredictionHistoryRepository } from "@/lib/history/repository";
import {
  predictionHistoryItemSchema,
  publicMatchSchema,
  publicPredictionSchema,
} from "@/types/public";

const rowSchema = z
  .object({
    prediction: publicPredictionSchema,
    match: publicMatchSchema,
    result: z.object({
      status: z.enum([
        "finished",
        "finished_after_extra_time",
        "finished_after_penalties",
      ]),
      scoreA90: z.number().int(),
      scoreB90: z.number().int(),
      scoreAFinal: z.number().int(),
      scoreBFinal: z.number().int(),
      winnerTeamId: z.string().nullable(),
      providerUpdatedAt: z.string().datetime({ offset: true }),
    }),
  })
  .strict();

type Options = {
  supabaseUrl: string;
  serviceRoleKey: string;
  fetchImplementation?: typeof fetch;
};

export class SupabaseHistoryRepository implements PredictionHistoryRepository {
  private readonly fetchImplementation: typeof fetch;
  private readonly restUrl: string;

  constructor(private readonly options: Options) {
    this.fetchImplementation = options.fetchImplementation ?? fetch;
    this.restUrl = `${options.supabaseUrl.replace(/\/$/, "")}/rest/v1`;
  }

  async listHistory(limit: number) {
    const response = await this.fetchImplementation(
      `${this.restUrl}/rpc/prediction_history`,
      {
        method: "POST",
        headers: createSupabaseServerHeaders(this.options.serviceRoleKey),
        body: JSON.stringify({ history_limit: limit }),
        cache: "no-store",
      },
    );
    if (!response.ok)
      throw new Error(`prediction_history_read_failed_${response.status}`);
    return z
      .array(rowSchema)
      .parse(await response.json())
      .map((row) => {
        const result = finalResultSchema.parse({
          matchProviderId: row.match.id,
          status: row.result.status,
          scoreA90: row.result.scoreA90,
          scoreB90: row.result.scoreB90,
          scoreAFinal: row.result.scoreAFinal,
          scoreBFinal: row.result.scoreBFinal,
          winnerProviderTeamId: row.result.winnerTeamId,
          providerUpdatedAt: row.result.providerUpdatedAt,
        });
        return predictionHistoryItemSchema.parse({
          match: row.match,
          prediction: row.prediction,
          result: {
            scoreA90: row.result.scoreA90,
            scoreB90: row.result.scoreB90,
            scoreAFinal: row.result.scoreAFinal,
            scoreBFinal: row.result.scoreBFinal,
            winnerTeamId: row.result.winnerTeamId,
          },
          accuracy: calculatePredictionAccuracy(
            row.prediction,
            result,
            row.match.teamA.id,
            row.match.teamB.id,
          ),
        });
      });
  }
}
