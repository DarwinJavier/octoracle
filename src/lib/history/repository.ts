import type { PredictionHistoryItem } from "@/types/public";

export type PredictionHistoryRepository = {
  listHistory(limit?: number): Promise<PredictionHistoryItem[]>;
};
