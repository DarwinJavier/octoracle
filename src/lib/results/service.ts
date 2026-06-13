import type { NormalizedFixture } from "@/lib/fixtures/types";
import type { PublicPrediction } from "@/types/public";
import {
  accuracyResultSchema,
  finalResultSchema,
  type FinalResult,
} from "./types";

const FINISHED = new Set([
  "finished",
  "finished_after_extra_time",
  "finished_after_penalties",
]);

export type ResultRepository = {
  applyResults(results: FinalResult[]): Promise<number>;
};

export function finalResultFromFixture(
  fixture: NormalizedFixture,
): FinalResult | null {
  if (!FINISHED.has(fixture.status)) return null;
  if (
    fixture.scoreA90 === null ||
    fixture.scoreB90 === null ||
    fixture.scoreAFinal === null ||
    fixture.scoreBFinal === null
  ) {
    throw new Error("finished_fixture_missing_scores");
  }
  const participantIds = [
    fixture.teamA?.providerId,
    fixture.teamB?.providerId,
  ].filter(Boolean);
  if (
    fixture.winnerProviderTeamId !== null &&
    !participantIds.includes(fixture.winnerProviderTeamId)
  ) {
    throw new Error("finished_fixture_invalid_winner");
  }
  return finalResultSchema.parse({
    matchProviderId: fixture.providerId,
    status: fixture.status,
    scoreA90: fixture.scoreA90,
    scoreB90: fixture.scoreB90,
    scoreAFinal: fixture.scoreAFinal,
    scoreBFinal: fixture.scoreBFinal,
    winnerProviderTeamId: fixture.winnerProviderTeamId,
    providerUpdatedAt: fixture.lastProviderUpdateAt,
  });
}

export async function syncResults(
  fixtures: NormalizedFixture[],
  repository: ResultRepository,
) {
  const results = fixtures
    .map(finalResultFromFixture)
    .filter((item) => item !== null);
  return {
    recordsRead: fixtures.length,
    recordsWritten: await repository.applyResults(results),
  };
}

function scoreOutcome(scoreA: number, scoreB: number) {
  if (scoreA > scoreB) return "team_a";
  if (scoreB > scoreA) return "team_b";
  return "draw";
}

export function calculatePredictionAccuracy(
  prediction: PublicPrediction,
  result: FinalResult,
  teamAProviderId: string,
  teamBProviderId: string,
) {
  const advancingTeamCorrect =
    prediction.predictedAdvancingTeamId === null
      ? null
      : prediction.predictedAdvancingTeamId === result.winnerProviderTeamId;
  return accuracyResultSchema.parse({
    outcomeCorrect:
      prediction.selectedOutcome ===
      scoreOutcome(result.scoreA90, result.scoreB90),
    exactScoreCorrect:
      prediction.predictedScoreA90 === result.scoreA90 &&
      prediction.predictedScoreB90 === result.scoreB90,
    advancingTeamCorrect:
      advancingTeamCorrect === null
        ? null
        : advancingTeamCorrect &&
          [teamAProviderId, teamBProviderId].includes(
            result.winnerProviderTeamId ?? "",
          ),
  });
}
