import { z } from "zod";

import { createSupabaseServerHeaders } from "@/lib/db/supabase-auth";
import type { PublicDataRepository } from "./repository";
import {
  normalizedFixtureSchema,
  type NormalizedFixture,
} from "@/lib/fixtures/types";
import { publicPredictionSchema } from "@/types/public";

const teamRow = z
  .object({
    provider_id: z.string(),
    fifa_code: z.string().nullable(),
    name: z.string(),
    short_name: z.string().nullable(),
    flag_asset_url: z.string().url().nullable(),
  })
  .nullable();

const matchRows = z.array(
  z
    .object({
      id: z.string().uuid(),
      provider_id: z.string(),
      official_match_number: z.number().int().nullable(),
      stage: z.string(),
      group_code: z.string().nullable(),
      kickoff_at_utc: z.string().datetime().nullable(),
      venue: z.string().nullable(),
      city: z.string().nullable(),
      status: z.string(),
      score_a_90: z.number().int().nullable(),
      score_b_90: z.number().int().nullable(),
      score_a_final: z.number().int().nullable(),
      score_b_final: z.number().int().nullable(),
      team_a_placeholder: z.string().nullable(),
      team_b_placeholder: z.string().nullable(),
      last_provider_update_at: z.string().datetime(),
      team_a: teamRow,
      team_b: teamRow,
    })
    .passthrough(),
);

const predictionRows = z.array(
  z
    .object({
      animation_seed: z.string(),
      confidence: z.enum(["low", "medium", "high"]),
      draw_probability: z.number(),
      freeze_at: z.string().datetime(),
      frozen_at: z.string().datetime().nullable(),
      generated_at: z.string().datetime(),
      predicted_advancing_team_id: z.string().nullable(),
      predicted_score_a_90: z.number().int(),
      predicted_score_b_90: z.number().int(),
      public_explanation: z.string(),
      reason_codes: z.array(z.string()),
      selected_outcome: z.enum(["team_a", "draw", "team_b"]),
      source_count: z.number().int(),
      status: z.enum(["published", "frozen"]),
      team_a_win_probability: z.number(),
      team_b_win_probability: z.number(),
      version: z.number().int(),
    })
    .passthrough(),
);

type Options = {
  supabaseUrl: string;
  serviceRoleKey: string;
  fetchImplementation?: typeof fetch;
};

export class SupabasePublicDataRepository implements PublicDataRepository {
  private readonly fetchImplementation: typeof fetch;
  private readonly restUrl: string;
  private readonly matchIds = new Map<string, string>();

  constructor(private readonly options: Options) {
    this.fetchImplementation = options.fetchImplementation ?? fetch;
    this.restUrl = `${options.supabaseUrl.replace(/\/$/, "")}/rest/v1`;
  }

  private async get(path: string) {
    const response = await this.fetchImplementation(`${this.restUrl}/${path}`, {
      headers: createSupabaseServerHeaders(this.options.serviceRoleKey),
      cache: "no-store",
    });
    if (!response.ok)
      throw new Error(`Public data read failed with status ${response.status}`);
    return response.json();
  }

  async listFixtures() {
    const rows = matchRows.parse(
      await this.get(
        "matches?select=*,team_a:teams!matches_team_a_id_fkey(*),team_b:teams!matches_team_b_id_fkey(*)&order=kickoff_at_utc.asc",
      ),
    );
    return rows.map((row) => {
      this.matchIds.set(row.provider_id, row.id);
      return normalizedFixtureSchema.parse({
        providerId: row.provider_id,
        officialMatchNumber: row.official_match_number,
        stage: row.stage,
        groupCode: row.group_code,
        teamA: row.team_a
          ? {
              providerId: row.team_a.provider_id,
              name: row.team_a.name,
              shortName: row.team_a.short_name,
              fifaCode: row.team_a.fifa_code,
              flagAssetUrl: row.team_a.flag_asset_url,
            }
          : null,
        teamB: row.team_b
          ? {
              providerId: row.team_b.provider_id,
              name: row.team_b.name,
              shortName: row.team_b.short_name,
              fifaCode: row.team_b.fifa_code,
              flagAssetUrl: row.team_b.flag_asset_url,
            }
          : null,
        teamAPlaceholder: row.team_a_placeholder,
        teamBPlaceholder: row.team_b_placeholder,
        kickoffAtUtc: row.kickoff_at_utc,
        venue: row.venue,
        city: row.city,
        status: row.status,
        scoreA90: row.score_a_90,
        scoreB90: row.score_b_90,
        scoreAFinal: row.score_a_final,
        scoreBFinal: row.score_b_final,
        winnerProviderTeamId: null,
        lastProviderUpdateAt: row.last_provider_update_at,
      });
    }) satisfies NormalizedFixture[];
  }

  async getPublishedPrediction(matchId: string) {
    const internalMatchId = this.matchIds.get(matchId);
    if (!internalMatchId) return null;
    const rows = predictionRows.parse(
      await this.get(
        `predictions?select=*&match_id=eq.${encodeURIComponent(internalMatchId)}&status=in.(published,frozen)&order=version.desc&limit=1`,
      ),
    );
    const row = rows[0];
    if (!row) return null;
    return publicPredictionSchema.parse({
      animationSeed: row.animation_seed,
      confidence: row.confidence,
      drawProbability: row.draw_probability,
      freezeAt: row.freeze_at,
      frozenAt: row.frozen_at,
      generatedAt: row.generated_at,
      predictedAdvancingTeamId: row.predicted_advancing_team_id,
      predictedScoreA90: row.predicted_score_a_90,
      predictedScoreB90: row.predicted_score_b_90,
      publicExplanation: row.public_explanation,
      reasonCodes: row.reason_codes,
      selectedOutcome: row.selected_outcome,
      sourceCount: row.source_count,
      status: row.status,
      teamAWinProbability: row.team_a_win_probability,
      teamBWinProbability: row.team_b_win_probability,
      version: row.version,
    });
  }
}
