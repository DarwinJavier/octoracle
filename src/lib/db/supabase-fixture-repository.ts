import { z } from "zod";

import { createSupabaseServerHeaders } from "@/lib/db/supabase-auth";
import type { NormalizedFixture, NormalizedTeam } from "@/lib/fixtures/types";
import type { FixtureRepository, SyncResult } from "@/lib/fixtures/sync";
import {
  recordedPreviewPredictionFor,
  recordedPreviewPredictionIds,
} from "@/lib/prediction/preview-ledger";

const teamIdSchema = z.array(
  z
    .object({ id: z.string().uuid(), provider_id: z.string().min(1) })
    .passthrough(),
);
const jobRunSchema = z.array(
  z
    .object({
      run_key: z.string(),
      records_read: z.number().int(),
      records_written: z.number().int(),
    })
    .passthrough(),
);
const matchIdSchema = z.array(
  z.object({ id: z.string().uuid(), provider_id: z.string().min(1) }).strict(),
);
const predictionSummarySchema = z.array(
  z
    .object({
      match_id: z.string().uuid(),
      version: z.number().int().positive(),
      status: z.enum(["draft", "published", "frozen", "superseded", "void"]),
      input_snapshot_hash: z.string().min(1),
    })
    .strict(),
);

type SupabaseFixtureRepositoryOptions = {
  supabaseUrl: string;
  serviceRoleKey: string;
  fetchImplementation?: typeof fetch;
};

export class SupabaseFixtureRepository implements FixtureRepository {
  private readonly fetchImplementation: typeof fetch;
  private readonly restUrl: string;

  constructor(private readonly options: SupabaseFixtureRepositoryOptions) {
    this.fetchImplementation = options.fetchImplementation ?? fetch;
    this.restUrl = `${options.supabaseUrl.replace(/\/$/, "")}/rest/v1`;
  }

  private async request(path: string, init: RequestInit = {}) {
    const response = await this.fetchImplementation(`${this.restUrl}/${path}`, {
      ...init,
      headers: {
        ...createSupabaseServerHeaders(this.options.serviceRoleKey),
        ...init.headers,
      },
      cache: "no-store",
    });
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 300);
      throw new Error(
        `Supabase fixture repository ${init.method ?? "GET"} ${path.split("?")[0]} failed with status ${response.status}: ${detail}`,
      );
    }
    return response;
  }

  async findCompletedRun(runKey: string) {
    const response = await this.request(
      `job_runs?select=run_key,records_read,records_written&job_name=eq.sync_fixtures&run_key=eq.${encodeURIComponent(runKey)}&status=eq.succeeded&limit=1`,
    );
    const rows = jobRunSchema.parse(await response.json());
    const row = rows[0];
    if (!row) return null;
    return {
      status: "succeeded",
      runKey: row.run_key,
      recordsRead: row.records_read,
      recordsWritten: row.records_written,
    } satisfies SyncResult;
  }

  async withJobLock<T>(jobName: string, work: () => Promise<T>) {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 60_000);
    await this.request(
      `job_locks?job_name=eq.${encodeURIComponent(jobName)}&expires_at=lt.${encodeURIComponent(now.toISOString())}`,
      { method: "DELETE" },
    );
    await this.request("job_locks", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        job_name: jobName,
        acquired_at: now,
        expires_at: expiresAt,
      }),
    });

    try {
      return await work();
    } finally {
      await this.request(
        `job_locks?job_name=eq.${encodeURIComponent(jobName)}`,
        {
          method: "DELETE",
        },
      );
    }
  }

  async upsertTeams(teams: NormalizedTeam[]) {
    if (teams.length === 0) return 0;
    await this.request("teams?on_conflict=provider_id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(
        teams.map((team) => ({
          provider_id: team.providerId,
          fifa_code: team.fifaCode,
          name: team.name,
          short_name: team.shortName,
          flag_asset_url: team.flagAssetUrl,
          updated_at: new Date().toISOString(),
        })),
      ),
    });
    return teams.length;
  }

  async upsertFixtures(fixtures: NormalizedFixture[]) {
    if (fixtures.length === 0) return 0;
    const teamsResponse = await this.request("teams?select=id,provider_id");
    const teamRows = teamIdSchema.parse(await teamsResponse.json());
    const teamIds = new Map(
      teamRows.map((team) => [team.provider_id, team.id]),
    );

    await this.request("matches?on_conflict=provider_id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(
        fixtures.map((fixture) => ({
          provider_id: fixture.providerId,
          official_match_number: fixture.officialMatchNumber,
          stage: fixture.stage,
          group_code: fixture.groupCode,
          team_a_id: fixture.teamA
            ? teamIds.get(fixture.teamA.providerId)
            : null,
          team_b_id: fixture.teamB
            ? teamIds.get(fixture.teamB.providerId)
            : null,
          team_a_placeholder: fixture.teamAPlaceholder,
          team_b_placeholder: fixture.teamBPlaceholder,
          kickoff_at_utc: fixture.kickoffAtUtc,
          venue: fixture.venue,
          city: fixture.city,
          status: fixture.status,
          score_a_90: fixture.scoreA90,
          score_b_90: fixture.scoreB90,
          score_a_final: fixture.scoreAFinal,
          score_b_final: fixture.scoreBFinal,
          winner_team_id: fixture.winnerProviderTeamId
            ? teamIds.get(fixture.winnerProviderTeamId)
            : null,
          last_provider_update_at: fixture.lastProviderUpdateAt,
          updated_at: new Date().toISOString(),
        })),
      ),
    });
    return fixtures.length;
  }

  async backfillRecordedPredictions() {
    const recordedIds = recordedPreviewPredictionIds();
    if (recordedIds.length === 0) return 0;
    const providerFilter = recordedIds
      .map((id) => `"${id.replaceAll('"', '\\"')}"`)
      .join(",");
    const matches = matchIdSchema.parse(
      await (
        await this.request(
          `matches?select=id,provider_id&provider_id=in.(${encodeURIComponent(providerFilter)})`,
        )
      ).json(),
    );
    if (matches.length === 0) return 0;

    const matchFilter = matches.map(({ id }) => `"${id}"`).join(",");
    const existing = predictionSummarySchema.parse(
      await (
        await this.request(
          `predictions?select=match_id,version,status,input_snapshot_hash&match_id=in.(${encodeURIComponent(matchFilter)})`,
        )
      ).json(),
    );
    const existingByMatchId = new Map<string, typeof existing>();
    for (const row of existing) {
      const rows = existingByMatchId.get(row.match_id) ?? [];
      rows.push(row);
      existingByMatchId.set(row.match_id, rows);
    }
    const statusUpdates: Array<{
      matchId: string;
      beforeVersion: number;
      fromStatus: "published" | "frozen";
      toStatus: "superseded" | "void";
    }> = [];
    const rows = matches.flatMap((match) => {
      const prediction = recordedPreviewPredictionFor(match.provider_id);
      if (!prediction) return [];
      const targetSnapshot = `reviewed-preview:${match.provider_id}:v${prediction.version}`;
      const existingPredictions = existingByMatchId.get(match.id) ?? [];
      if (
        existingPredictions.some(
          (item) => item.input_snapshot_hash === targetSnapshot,
        )
      ) {
        return [];
      }
      const latestVersion = existingPredictions.reduce(
        (max, item) => Math.max(max, item.version),
        0,
      );
      if (latestVersion >= prediction.version) return [];
      if (existingPredictions.some((item) => item.status === "published")) {
        statusUpdates.push({
          matchId: match.id,
          beforeVersion: prediction.version,
          fromStatus: "published",
          toStatus: "superseded",
        });
      }
      if (existingPredictions.some((item) => item.status === "frozen")) {
        statusUpdates.push({
          matchId: match.id,
          beforeVersion: prediction.version,
          fromStatus: "frozen",
          toStatus: "void",
        });
      }
      const isFrozen = Date.now() >= Date.parse(prediction.freezeAt);
      return [
        {
          match_id: match.id,
          version: prediction.version,
          status: isFrozen ? "frozen" : "published",
          team_a_win_probability: prediction.teamAWinProbability,
          draw_probability: prediction.drawProbability,
          team_b_win_probability: prediction.teamBWinProbability,
          expected_goals_a: prediction.predictedScoreA90,
          expected_goals_b: prediction.predictedScoreB90,
          predicted_score_a_90: prediction.predictedScoreA90,
          predicted_score_b_90: prediction.predictedScoreB90,
          predicted_advancing_team_id: null,
          selected_outcome: prediction.selectedOutcome,
          confidence: prediction.confidence,
          reason_codes: prediction.reasonCodes,
          public_explanation: prediction.publicExplanation,
          source_count: prediction.sourceCount,
          generated_at: prediction.generatedAt,
          freeze_at: prediction.freezeAt,
          frozen_at: isFrozen
            ? (prediction.frozenAt ?? prediction.freezeAt)
            : null,
          animation_seed: prediction.animationSeed,
          model_version: "reviewed-preview-v1",
          algorithm_version: "reviewed-preview-v1",
          input_snapshot_hash: targetSnapshot,
        },
      ];
    });
    if (rows.length === 0) return 0;

    await this.request("predictions", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(rows),
    });
    for (const update of statusUpdates) {
      await this.request(
        `predictions?match_id=eq.${encodeURIComponent(update.matchId)}&status=eq.${update.fromStatus}&version=lt.${update.beforeVersion}`,
        {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({ status: update.toStatus }),
        },
      );
    }
    return rows.length;
  }

  async recordCompletedRun(result: SyncResult) {
    const now = new Date().toISOString();
    await this.request("job_runs?on_conflict=job_name,run_key", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        job_name: "sync_fixtures",
        status: "succeeded",
        started_at: now,
        finished_at: now,
        records_read: result.recordsRead,
        records_written: result.recordsWritten,
        run_key: result.runKey,
      }),
    });
  }

  async recordFailedRun(runKey: string, errorCode: string) {
    const now = new Date().toISOString();
    await this.request("job_runs?on_conflict=job_name,run_key", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        job_name: "sync_fixtures",
        status: "failed",
        started_at: now,
        finished_at: now,
        records_read: 0,
        records_written: 0,
        error_code: errorCode,
        error_summary:
          "Fixture synchronization failed; inspect structured provider telemetry.",
        run_key: runKey,
      }),
    });
  }
}
