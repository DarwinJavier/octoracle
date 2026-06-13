import type { SourceObservation } from "@/lib/research/types";

export function sourceObservation(
  overrides: Partial<SourceObservation> = {},
): SourceObservation {
  return {
    matchId: "00000000-0000-4000-8000-000000000001",
    sourceDomain: "example.com",
    canonicalUrl: "https://example.com/report",
    title: "Match report",
    publishedAt: "2026-06-09T12:00:00.000Z",
    retrievedAt: "2026-06-09T13:00:00.000Z",
    contentHash: "a".repeat(64),
    lean: "team_a",
    confidence: 0.8,
    evidenceCategories: ["form"],
    summary: "Team A has the stronger recent form.",
    parserVersion: "plain-text-1.0.0",
    modelVersion: "test-model",
    ...overrides,
  };
}
