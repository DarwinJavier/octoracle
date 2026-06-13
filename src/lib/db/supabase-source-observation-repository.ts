import { createSupabaseServerHeaders } from "@/lib/db/supabase-auth";
import type { SourceObservationRepository } from "@/lib/research/repository";
import {
  sourceObservationSchema,
  type SourceObservation,
} from "@/lib/research/types";

type Options = {
  supabaseUrl: string;
  serviceRoleKey: string;
  fetchImplementation?: typeof fetch;
};

export class SupabaseSourceObservationRepository implements SourceObservationRepository {
  private readonly fetchImplementation: typeof fetch;
  private readonly restUrl: string;

  constructor(private readonly options: Options) {
    this.fetchImplementation = options.fetchImplementation ?? fetch;
    this.restUrl = `${options.supabaseUrl.replace(/\/$/, "")}/rest/v1`;
  }

  async saveObservations(rawObservations: SourceObservation[]) {
    const observations = rawObservations.map((item) =>
      sourceObservationSchema.parse(item),
    );
    if (observations.length === 0) return 0;
    const response = await this.fetchImplementation(
      `${this.restUrl}/source_observations?on_conflict=match_id,source_domain,content_hash`,
      {
        method: "POST",
        headers: {
          ...createSupabaseServerHeaders(this.options.serviceRoleKey),
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify(
          observations.map((item) => ({
            match_id: item.matchId,
            source_domain: item.sourceDomain,
            canonical_url: item.canonicalUrl,
            title: item.title,
            published_at: item.publishedAt,
            retrieved_at: item.retrievedAt,
            content_hash: item.contentHash,
            lean: item.lean,
            confidence: item.confidence,
            evidence_categories: item.evidenceCategories,
            summary: item.summary,
            parser_version: item.parserVersion,
            model_version: item.modelVersion,
          })),
        ),
        cache: "no-store",
      },
    );
    if (!response.ok)
      throw new Error(`source_observation_write_failed_${response.status}`);
    return observations.length;
  }
}
