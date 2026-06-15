import { z } from "zod";

import { createSupabaseServerHeaders } from "@/lib/db/supabase-auth";
import { SupabasePredictionRepository } from "@/lib/db/supabase-prediction-repository";
import type {
  PredictionBuildContext,
  PredictionBuildRepository,
} from "@/lib/prediction/live";
import type { BuiltPrediction, PredictionInput } from "@/lib/prediction/types";
import type { NormalizedFixture } from "@/lib/fixtures/types";
import { sourceObservationSchema } from "@/lib/research/types";

const teamRowSchema = z.object({
  id: z.string().uuid(),
  provider_id: z.string().min(1),
  name: z.string().min(1),
});

const matchRowsSchema = z.array(
  z.object({
    id: z.string().uuid(),
    kickoff_at_utc: z.string().datetime(),
    stage: z.string().min(1),
    group_code: z.string().nullable(),
    status: z.literal("scheduled"),
    team_a: teamRowSchema,
    team_b: teamRowSchema,
  }),
);

const observationRowsSchema = z.array(
  z.object({
    match_id: z.string().uuid(),
    source_domain: z.string().min(1),
    canonical_url: z.string().url(),
    title: z.string().min(1),
    published_at: z.string().datetime().nullable(),
    retrieved_at: z.string().datetime(),
    content_hash: z.string().min(1),
    lean: z.enum(["team_a", "draw", "team_b", "unclear"]),
    confidence: z.number().min(0).max(1),
    evidence_categories: z.array(z.string()),
    summary: z.string().min(1),
    parser_version: z.string().min(1),
    model_version: z.string().min(1),
  }),
);

const candidateMatchRowsSchema = z.array(
  z.object({
    id: z.string().uuid(),
  }),
);

const candidatePredictionRowsSchema = z.array(
  z.object({
    match_id: z.string().uuid(),
    generated_at: z.string().datetime(),
  }),
);

type Options = {
  supabaseUrl: string;
  serviceRoleKey: string;
  fetchImplementation?: typeof fetch;
};

export class SupabasePredictionBuildRepository implements PredictionBuildRepository {
  private readonly fetchImplementation: typeof fetch;
  private readonly predictionRepository: SupabasePredictionRepository;
  private readonly restUrl: string;

  constructor(private readonly buildOptions: Options) {
    this.fetchImplementation = buildOptions.fetchImplementation ?? fetch;
    this.predictionRepository = new SupabasePredictionRepository(buildOptions);
    this.restUrl = `${buildOptions.supabaseUrl.replace(/\/$/, "")}/rest/v1`;
  }

  private async request(path: string, init: RequestInit = {}) {
    const response = await this.fetchImplementation(`${this.restUrl}/${path}`, {
      ...init,
      headers: {
        ...createSupabaseServerHeaders(this.buildOptions.serviceRoleKey),
        ...init.headers,
      },
      cache: "no-store",
    });
    if (!response.ok)
      throw new Error(`prediction_build_repository_failed_${response.status}`);
    return response;
  }

  publishVersion(
    ...args: Parameters<SupabasePredictionRepository["publishVersion"]>
  ) {
    return this.predictionRepository.publishVersion(...args);
  }

  freezeDue(...args: Parameters<SupabasePredictionRepository["freezeDue"]>) {
    return this.predictionRepository.freezeDue(...args);
  }

  voidFrozenForMatch(
    ...args: Parameters<SupabasePredictionRepository["voidFrozenForMatch"]>
  ) {
    return this.predictionRepository.voidFrozenForMatch(...args);
  }

  async getBuildContext(matchId: string) {
    const rows = matchRowsSchema.parse(
      await (
        await this.request(
          `matches?select=id,kickoff_at_utc,stage,group_code,status,team_a:teams!matches_team_a_id_fkey(id,provider_id,name),team_b:teams!matches_team_b_id_fkey(id,provider_id,name)&id=eq.${encodeURIComponent(matchId)}&status=eq.scheduled&limit=1`,
        )
      ).json(),
    );
    const row = rows[0];
    if (!row) return null;
    return {
      matchId: row.id,
      kickoffAtUtc: row.kickoff_at_utc,
      stage: row.stage,
      groupCode: row.group_code,
      status: row.status,
      teamA: {
        id: row.team_a.id,
        providerId: row.team_a.provider_id,
        name: row.team_a.name,
      },
      teamB: {
        id: row.team_b.id,
        providerId: row.team_b.provider_id,
        name: row.team_b.name,
      },
    } satisfies PredictionBuildContext;
  }

  async listObservations(matchId: string) {
    const rows = observationRowsSchema.parse(
      await (
        await this.request(
          `source_observations?select=*&match_id=eq.${encodeURIComponent(matchId)}`,
        )
      ).json(),
    );
    return rows.map((row) =>
      sourceObservationSchema.parse({
        matchId: row.match_id,
        sourceDomain: row.source_domain,
        canonicalUrl: row.canonical_url,
        title: row.title,
        publishedAt: row.published_at,
        retrievedAt: row.retrieved_at,
        contentHash: row.content_hash,
        lean: row.lean,
        confidence: row.confidence,
        evidenceCategories: row.evidence_categories,
        summary: row.summary,
        parserVersion: row.parser_version,
        modelVersion: row.model_version,
      }),
    );
  }

  async listPredictionBuildCandidates(
    now: Date,
    horizonHours: number,
    refreshHours: number,
  ) {
    const horizon = new Date(now.getTime() + horizonHours * 60 * 60_000);
    const matches = candidateMatchRowsSchema.parse(
      await (
        await this.request(
          `matches?select=id&status=eq.scheduled&team_a_id=not.is.null&team_b_id=not.is.null&kickoff_at_utc=gt.${encodeURIComponent(now.toISOString())}&kickoff_at_utc=lte.${encodeURIComponent(horizon.toISOString())}&order=kickoff_at_utc.asc`,
        )
      ).json(),
    );
    if (matches.length === 0) return [];

    const matchFilter = matches.map(({ id }) => `"${id}"`).join(",");
    const predictions = candidatePredictionRowsSchema.parse(
      await (
        await this.request(
          `predictions?select=match_id,generated_at&match_id=in.(${encodeURIComponent(matchFilter)})&status=in.(published,frozen)&order=generated_at.desc`,
        )
      ).json(),
    );
    const latestByMatch = new Map<string, number>();
    for (const prediction of predictions) {
      if (!latestByMatch.has(prediction.match_id)) {
        latestByMatch.set(
          prediction.match_id,
          Date.parse(prediction.generated_at),
        );
      }
    }
    const refreshBefore = now.getTime() - refreshHours * 60 * 60_000;
    return matches
      .filter(({ id }) => (latestByMatch.get(id) ?? 0) <= refreshBefore)
      .map(({ id }) => id);
  }

  async saveSignalSnapshot(
    input: PredictionInput,
    prediction: BuiltPrediction,
    calculatedAt: string,
    history: { teamA: NormalizedFixture[]; teamB: NormalizedFixture[] },
  ) {
    await this.request(
      "prediction_signal_snapshots?on_conflict=input_snapshot_hash",
      {
        method: "POST",
        headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
        body: JSON.stringify({
          match_id: input.matchId,
          input_snapshot_hash: prediction.inputSnapshotHash,
          team_a_signals: input.teamA,
          team_b_signals: input.teamB,
          team_a_history_provider_ids: history.teamA.map(
            (fixture) => fixture.providerId,
          ),
          team_b_history_provider_ids: history.teamB.map(
            (fixture) => fixture.providerId,
          ),
          source_count: input.sourceCount,
          calculated_at: calculatedAt,
          cutoff_at: input.kickoffAtUtc,
          algorithm_version: prediction.algorithmVersion,
        }),
      },
    );
  }
}
