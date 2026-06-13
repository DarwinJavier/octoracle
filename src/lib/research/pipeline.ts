import { sourceObservationSchema, type SourceObservation } from "./types";
import type { AllowlistedResearchFetcher } from "./fetcher";
import type { ObservationExtractor } from "./extractor";

export type ResearchSource = { url: string };

export async function researchMatch(
  match: { id: string; teamA: string; teamB: string },
  sources: ResearchSource[],
  fetcher: AllowlistedResearchFetcher,
  extractor: ObservationExtractor,
  versions: { parser: string; model: string },
) {
  const observations: SourceObservation[] = [];
  for (const source of sources) {
    const document = await fetcher.fetch(source.url);
    const extracted = await extractor.extract(document, {
      teamA: match.teamA,
      teamB: match.teamB,
    });
    observations.push(
      sourceObservationSchema.parse({
        ...extracted,
        matchId: match.id,
        sourceDomain: document.sourceDomain,
        canonicalUrl: document.canonicalUrl,
        title: document.title,
        retrievedAt: document.retrievedAt,
        contentHash: document.contentHash,
        parserVersion: versions.parser,
        modelVersion: versions.model,
      }),
    );
  }
  return observations;
}
