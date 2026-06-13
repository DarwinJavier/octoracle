import { SupabaseHistoryRepository } from "@/lib/db/supabase-history-repository";
import { buildHistoryResponse } from "./service";
import { staticMatch, staticPrediction } from "@/lib/static-match";
import {
  predictionHistoryItemSchema,
  type PredictionHistoryResponse,
} from "@/types/public";
import { loadRecordedProviderHistory } from "@/lib/public-data/provider-preview";

export function demoHistory(): PredictionHistoryResponse {
  return buildHistoryResponse([
    predictionHistoryItemSchema.parse({
      match: { ...staticMatch, status: "finished" },
      prediction: {
        ...staticPrediction,
        status: "frozen",
        frozenAt: staticMatch.kickoffAtUtc,
      },
      result: {
        scoreA90: 2,
        scoreB90: 1,
        scoreAFinal: 2,
        scoreBFinal: 1,
        winnerTeamId: staticMatch.teamA.id,
      },
      accuracy: {
        outcomeCorrect: true,
        exactScoreCorrect: true,
        advancingTeamCorrect: null,
      },
    }),
  ]);
}

export async function loadPredictionHistory(limit = 20) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const previewHistory = process.env.FOOTBALL_DATA_API_KEY
    ? await loadRecordedProviderHistory(
        process.env.FOOTBALL_DATA_API_KEY,
      ).catch(() => [])
    : [];
  if (!supabaseUrl || !serviceRoleKey)
    return buildHistoryResponse(previewHistory.slice(0, limit));
  try {
    const stored = await new SupabaseHistoryRepository({
      supabaseUrl,
      serviceRoleKey,
    }).listHistory(limit);
    const storedIds = new Set(stored.map((item) => item.match.id));
    return buildHistoryResponse(
      [
        ...stored,
        ...previewHistory.filter((item) => !storedIds.has(item.match.id)),
      ].slice(0, limit),
    );
  } catch {
    return buildHistoryResponse(previewHistory.slice(0, limit));
  }
}
