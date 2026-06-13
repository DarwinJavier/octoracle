import { z } from "zod";

import {
  teamSignalsSchema,
  type PredictionInput,
} from "@/lib/prediction/types";

const rankingRowSchema = z
  .object({
    IdCountry: z.string().min(2).max(4),
    Rank: z.number().int().positive(),
    DecimalTotalPoints: z.number().positive(),
    DecimalPrevPoints: z.number().positive(),
    PubDate: z.string().datetime({ offset: true }),
  })
  .passthrough();

const rankingResponseSchema = z
  .object({
    Results: z.array(rankingRowSchema).min(1),
  })
  .passthrough();

export type FifaRankingSignal = {
  code: string;
  rank: number;
  strength: number;
  recentForm: number;
  publishedAt: string;
};

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function parseFifaRankingResponse(input: unknown) {
  const rows = rankingResponseSchema.parse(input).Results;
  const points = rows.map((row) => row.DecimalTotalPoints);
  const minimum = Math.min(...points);
  const maximum = Math.max(...points);
  const range = Math.max(1, maximum - minimum);

  return new Map(
    rows.map((row) => [
      row.IdCountry.toUpperCase(),
      {
        code: row.IdCountry.toUpperCase(),
        rank: row.Rank,
        strength: clamp((row.DecimalTotalPoints - minimum) / range),
        recentForm: clamp(
          0.5 + (row.DecimalTotalPoints - row.DecimalPrevPoints) / 50,
        ),
        publishedAt: new Date(row.PubDate).toISOString(),
      } satisfies FifaRankingSignal,
    ]),
  );
}

export class FifaRankingProvider {
  constructor(private readonly fetchImplementation: typeof fetch = fetch) {}

  async fetchRankings() {
    const response = await this.fetchImplementation(
      "https://api.fifa.com/api/v3/rankings?locale=en&gender=1",
      {
        headers: { Accept: "application/json" },
        cache: "force-cache",
        next: { revalidate: 21_600 },
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!response.ok)
      throw new Error(
        `FIFA ranking request failed with status ${response.status}`,
      );
    return parseFifaRankingResponse(await response.json());
  }
}

export function applyFifaRankingSignal(
  signals: PredictionInput["teamA"],
  ranking: FifaRankingSignal,
  hasHistory: boolean,
) {
  return teamSignalsSchema.parse({
    ...signals,
    longTermStrength: hasHistory
      ? signals.longTermStrength * 0.35 + ranking.strength * 0.65
      : ranking.strength,
    recentForm: hasHistory
      ? signals.recentForm * 0.75 + ranking.recentForm * 0.25
      : ranking.recentForm,
  });
}
