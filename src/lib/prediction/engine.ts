import { createHash } from "node:crypto";

import {
  ALGORITHM_VERSION,
  MAX_GOALS,
  MODEL_VERSION,
  PREDICTION_WEIGHTS,
} from "./config";
import {
  predictionInputSchema,
  type BuiltPrediction,
  type Confidence,
  type PredictionInput,
  type SelectedOutcome,
} from "./types";

function round(value: number, places = 6) {
  return Number(value.toFixed(places));
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function stableSnapshot(input: PredictionInput) {
  return JSON.stringify({
    algorithmVersion: ALGORITHM_VERSION,
    input,
    weights: PREDICTION_WEIGHTS,
  });
}

function performance(signals: PredictionInput["teamA"]) {
  return (signals.attackingPerformance + signals.defensivePerformance) / 2;
}

function rating(signals: PredictionInput["teamA"]) {
  return (
    signals.longTermStrength * PREDICTION_WEIGHTS.longTermStrength +
    signals.recentForm * PREDICTION_WEIGHTS.recentForm +
    performance(signals) * PREDICTION_WEIGHTS.performance +
    signals.squadAvailability * PREDICTION_WEIGHTS.squadAvailability +
    signals.publicConsensus * PREDICTION_WEIGHTS.publicConsensus
  );
}

function softmax(values: number[]) {
  const exponentials = values.map((value) => Math.exp(value));
  const total = exponentials.reduce((sum, value) => sum + value, 0);
  return exponentials.map((value) => value / total);
}

function poisson(goals: number, expectedGoals: number) {
  let factorial = 1;
  for (let value = 2; value <= goals; value += 1) factorial *= value;
  return (Math.exp(-expectedGoals) * expectedGoals ** goals) / factorial;
}

function outcomeForScore(teamA: number, teamB: number): SelectedOutcome {
  if (teamA > teamB) return "team_a";
  if (teamB > teamA) return "team_b";
  return "draw";
}

function mostLikelyScore(
  expectedA: number,
  expectedB: number,
  outcome: SelectedOutcome,
) {
  let best = { teamA: 0, teamB: 0, probability: -1 };
  for (let teamA = 0; teamA <= MAX_GOALS; teamA += 1) {
    for (let teamB = 0; teamB <= MAX_GOALS; teamB += 1) {
      if (outcomeForScore(teamA, teamB) !== outcome) continue;
      const probability = poisson(teamA, expectedA) * poisson(teamB, expectedB);
      if (probability > best.probability) best = { teamA, teamB, probability };
    }
  }
  return best;
}

function confidenceFor(probability: number): Confidence {
  if (probability >= 0.6) return "high";
  if (probability >= 0.45) return "medium";
  return "low";
}

function reasonCodes(input: PredictionInput, advantage: number) {
  const stronger = advantage >= 0 ? input.teamA : input.teamB;
  const weaker = advantage >= 0 ? input.teamB : input.teamA;
  const reasons: string[] = [];
  if (stronger.longTermStrength - weaker.longTermStrength >= 0.08)
    reasons.push("baseline_strength");
  if (stronger.recentForm - weaker.recentForm >= 0.08)
    reasons.push("recent_form");
  if (performance(stronger) - performance(weaker) >= 0.08)
    reasons.push("attack_defense");
  if (stronger.squadAvailability - weaker.squadAvailability >= 0.08)
    reasons.push("squad_availability");
  if (stronger.publicConsensus - weaker.publicConsensus >= 0.08)
    reasons.push("public_consensus");
  if (Math.abs(advantage) < 0.08) reasons.unshift("closely_matched");
  return reasons.slice(0, 3).length > 0
    ? reasons.slice(0, 3)
    : ["balanced_inputs"];
}

function explanation(
  input: PredictionInput,
  outcome: SelectedOutcome,
  reasons: string[],
) {
  const selection =
    outcome === "draw"
      ? "The model sees a closely matched contest"
      : `${outcome === "team_a" ? input.teamAName : input.teamBName} receives the stronger forecast`;
  const labels: Record<string, string> = {
    attack_defense: "attacking and defensive performance",
    balanced_inputs: "balanced validated inputs",
    baseline_strength: "long-term team strength",
    closely_matched: "a narrow overall rating gap",
    public_consensus: "validated public-source consensus",
    recent_form: "recent form",
    squad_availability: "squad availability",
  };
  return `${selection} based on ${reasons.map((reason) => labels[reason]).join(", ")}. Meaningful uncertainty remains.`;
}

export function buildPrediction(rawInput: PredictionInput): BuiltPrediction {
  const input = predictionInputSchema.parse(rawInput);
  const teamARating = rating(input.teamA);
  const teamBRating = rating(input.teamB);
  const advantage = teamARating - teamBRating;
  const drawAffinity = 1.25 - Math.min(Math.abs(advantage) * 2.5, 0.8);
  const [teamAWinProbability, drawProbability, teamBWinProbability] = softmax([
    advantage * 4,
    drawAffinity,
    -advantage * 4,
  ]).map((value) => round(value));
  const normalization =
    teamAWinProbability + drawProbability + teamBWinProbability;
  const probabilities = [
    round(teamAWinProbability / normalization),
    round(drawProbability / normalization),
    round(teamBWinProbability / normalization),
  ];
  probabilities[2] = round(1 - probabilities[0] - probabilities[1]);

  const outcomeCandidates: SelectedOutcome[] = ["team_a", "draw", "team_b"];
  const selectedOutcome = outcomeCandidates[
    probabilities.indexOf(Math.max(...probabilities))
  ] as SelectedOutcome;
  const expectedGoalsA = round(
    clamp(
      0.65 + input.teamA.attackingPerformance * 1.35 + advantage * 0.8,
      0.1,
      4,
    ),
    3,
  );
  const expectedGoalsB = round(
    clamp(
      0.65 + input.teamB.attackingPerformance * 1.35 - advantage * 0.8,
      0.1,
      4,
    ),
    3,
  );
  const score = mostLikelyScore(
    expectedGoalsA,
    expectedGoalsB,
    selectedOutcome,
  );
  const reasons = reasonCodes(input, advantage);
  const snapshot = stableSnapshot(input);

  return {
    matchId: input.matchId,
    teamAWinProbability: probabilities[0],
    drawProbability: probabilities[1],
    teamBWinProbability: probabilities[2],
    expectedGoalsA,
    expectedGoalsB,
    predictedScoreA90: score.teamA,
    predictedScoreB90: score.teamB,
    predictedAdvancingTeamId:
      input.stageType === "knockout"
        ? advantage >= 0
          ? input.teamAId
          : input.teamBId
        : null,
    selectedOutcome,
    confidence: confidenceFor(Math.max(...probabilities)),
    reasonCodes: reasons,
    publicExplanation: explanation(input, selectedOutcome, reasons),
    sourceCount: input.sourceCount,
    freezeAt: input.kickoffAtUtc,
    animationSeed: hash(`${input.matchId}:${snapshot}`).slice(0, 24),
    modelVersion: MODEL_VERSION,
    algorithmVersion: ALGORITHM_VERSION,
    inputSnapshotHash: hash(snapshot),
  };
}
