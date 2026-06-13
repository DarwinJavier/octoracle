import {
  predictionHistoryResponseSchema,
  type PredictionHistoryItem,
} from "@/types/public";

export function buildHistoryResponse(items: PredictionHistoryItem[]) {
  const total = items.length;
  return predictionHistoryResponseSchema.parse({
    items,
    total,
    outcomeAccuracy:
      total > 0
        ? items.filter((item) => item.accuracy.outcomeCorrect).length / total
        : null,
    exactScoreAccuracy:
      total > 0
        ? items.filter((item) => item.accuracy.exactScoreCorrect).length / total
        : null,
  });
}
