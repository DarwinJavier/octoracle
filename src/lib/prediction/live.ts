import type { NormalizedFixture } from "@/lib/fixtures/types";
import { publishPrediction, type PredictionFixtureState } from "./lifecycle";
import { buildPrediction } from "@/lib/prediction/engine";
import type { BuiltPrediction, PredictionInput } from "@/lib/prediction/types";
import { calculateHistorySignals } from "@/lib/prediction/signals/history";
import { calculateConsensus } from "@/lib/research/consensus";
import { applyConsensusToPredictionInput } from "@/lib/research/prediction-input";
import type { SourceObservation } from "@/lib/research/types";
import type { PredictionRepository } from "./lifecycle";

export type PredictionBuildContext = {
  matchId: string;
  kickoffAtUtc: string;
  stage: string;
  groupCode: string | null;
  status: PredictionFixtureState["status"];
  teamA: {
    id: string;
    providerId: string;
    name: string;
  };
  teamB: {
    id: string;
    providerId: string;
    name: string;
  };
};

export type PredictionHistoryProvider = {
  fetchCompletedTeamMatches(
    teamProviderId: string,
    before: string,
    limit?: number,
  ): Promise<NormalizedFixture[]>;
};

export type PredictionBuildRepository = PredictionRepository & {
  getBuildContext(matchId: string): Promise<PredictionBuildContext | null>;
  listObservations(matchId: string): Promise<SourceObservation[]>;
  saveSignalSnapshot(
    input: PredictionInput,
    prediction: BuiltPrediction,
    calculatedAt: string,
    history: { teamA: NormalizedFixture[]; teamB: NormalizedFixture[] },
  ): Promise<void>;
};

function stageType(stage: string, groupCode: string | null) {
  return groupCode || stage.toLowerCase().includes("group")
    ? ("group" as const)
    : ("knockout" as const);
}

export async function buildLivePrediction(
  matchId: string,
  provider: PredictionHistoryProvider,
  repository: PredictionBuildRepository,
  now = new Date(),
) {
  const context = await repository.getBuildContext(matchId);
  if (!context) throw new Error("prediction_match_not_found");
  if (now.getTime() >= Date.parse(context.kickoffAtUtc))
    throw new Error("prediction_frozen");

  const [teamAHistory, teamBHistory, observations] = await Promise.all([
    provider.fetchCompletedTeamMatches(
      context.teamA.providerId,
      context.kickoffAtUtc,
    ),
    provider.fetchCompletedTeamMatches(
      context.teamB.providerId,
      context.kickoffAtUtc,
    ),
    repository.listObservations(context.matchId),
  ]);
  const consensus = calculateConsensus(observations, now);
  const baseInput: PredictionInput = {
    matchId: context.matchId,
    stageType: stageType(context.stage, context.groupCode),
    teamAId: context.teamA.id,
    teamAName: context.teamA.name,
    teamBId: context.teamB.id,
    teamBName: context.teamB.name,
    teamA: calculateHistorySignals(context.teamA.providerId, teamAHistory),
    teamB: calculateHistorySignals(context.teamB.providerId, teamBHistory),
    sourceCount: 0,
    kickoffAtUtc: context.kickoffAtUtc,
  };
  const input = applyConsensusToPredictionInput(baseInput, consensus);
  const calculatedAt = now.toISOString();
  await repository.saveSignalSnapshot(
    input,
    buildPrediction(input),
    calculatedAt,
    {
      teamA: teamAHistory,
      teamB: teamBHistory,
    },
  );
  const prediction = await publishPrediction(
    input,
    {
      matchId: context.matchId,
      kickoffAtUtc: context.kickoffAtUtc,
      status: context.status,
    },
    repository,
    now,
  );
  return {
    prediction,
    historyMatchesRead: teamAHistory.length + teamBHistory.length,
    sourceCount: consensus.sourceCount,
  };
}
