import { sourceObservationSchema, type SourceObservation } from "./types";

export type ConsensusSignal = {
  teamA: number;
  teamB: number;
  sourceCount: number;
  agreeingSources: number;
  disagreeingSources: number;
  sufficient: boolean;
};

function freshnessWeight(observation: SourceObservation, now: Date) {
  const published = observation.publishedAt
    ? Date.parse(observation.publishedAt)
    : Date.parse(observation.retrievedAt);
  const ageDays = Math.max(0, (now.getTime() - published) / 86_400_000);
  return Math.max(0.25, 1 - ageDays / 30);
}

export function deduplicateObservations(observations: SourceObservation[]) {
  const accepted = observations.map((item) =>
    sourceObservationSchema.parse(item),
  );
  const seenHashes = new Set<string>();
  const domainCounts = new Map<string, number>();
  return accepted.filter((observation) => {
    if (seenHashes.has(observation.contentHash)) return false;
    const domainCount = domainCounts.get(observation.sourceDomain) ?? 0;
    if (domainCount >= 2) return false;
    seenHashes.add(observation.contentHash);
    domainCounts.set(observation.sourceDomain, domainCount + 1);
    return true;
  });
}

export function calculateConsensus(
  observations: SourceObservation[],
  now = new Date(),
): ConsensusSignal {
  const accepted = deduplicateObservations(observations);
  const scores = { team_a: 0, draw: 0, team_b: 0 };
  for (const observation of accepted) {
    if (observation.lean === "unclear") continue;
    scores[observation.lean] +=
      observation.confidence * freshnessWeight(observation, now);
  }
  const total = scores.team_a + scores.draw + scores.team_b;
  const teamA = total > 0 ? (scores.team_a + scores.draw * 0.5) / total : 0.5;
  const teamB = total > 0 ? (scores.team_b + scores.draw * 0.5) / total : 0.5;
  const leading = Math.max(scores.team_a, scores.draw, scores.team_b);
  const meaningful = accepted.filter(
    (
      item,
    ): item is SourceObservation & {
      lean: "team_a" | "draw" | "team_b";
    } => item.lean !== "unclear",
  );
  return {
    teamA,
    teamB,
    sourceCount: accepted.length,
    agreeingSources: meaningful.filter((item) => scores[item.lean] === leading)
      .length,
    disagreeingSources: meaningful.filter(
      (item) => scores[item.lean] !== leading,
    ).length,
    sufficient: new Set(meaningful.map((item) => item.sourceDomain)).size >= 3,
  };
}
