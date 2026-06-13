import { buildPrediction } from "./engine";
import type {
  BuiltPrediction,
  PredictionInput,
  StoredPrediction,
} from "./types";

export type PredictionFixtureState = {
  matchId: string;
  kickoffAtUtc: string | null;
  status:
    | "scheduled"
    | "live"
    | "halftime"
    | "postponed"
    | "cancelled"
    | "finished"
    | "unknown";
};

export type PredictionRepository = {
  publishVersion(
    prediction: BuiltPrediction,
    generatedAt: string,
  ): Promise<StoredPrediction>;
  freezeDue(now: string): Promise<number>;
  voidFrozenForMatch(matchId: string): Promise<number>;
};

export async function publishPrediction(
  input: PredictionInput,
  fixture: PredictionFixtureState,
  repository: PredictionRepository,
  now = new Date(),
) {
  if (fixture.matchId !== input.matchId)
    throw new Error("prediction_match_mismatch");
  if (!fixture.kickoffAtUtc || fixture.status !== "scheduled") {
    throw new Error("match_not_prediction_eligible");
  }
  if (input.kickoffAtUtc !== fixture.kickoffAtUtc)
    throw new Error("stale_kickoff_input");
  if (now.getTime() >= Date.parse(fixture.kickoffAtUtc))
    throw new Error("prediction_frozen");

  return repository.publishVersion(buildPrediction(input), now.toISOString());
}

export async function freezeDuePredictions(
  repository: PredictionRepository,
  now = new Date(),
) {
  return repository.freezeDue(now.toISOString());
}

export async function reconcileFrozenPrediction(
  fixture: PredictionFixtureState,
  previousKickoffAtUtc: string,
  repository: PredictionRepository,
) {
  const kickoffChanged = fixture.kickoffAtUtc !== previousKickoffAtUtc;
  if (fixture.status === "postponed" || kickoffChanged) {
    return repository.voidFrozenForMatch(fixture.matchId);
  }
  return 0;
}
