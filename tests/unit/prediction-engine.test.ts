import { describe, expect, it } from "vitest";

import { ALGORITHM_VERSION } from "@/lib/prediction/config";
import { buildPrediction } from "@/lib/prediction/engine";
import { predictionInput } from "../fixtures/prediction-input";

describe("deterministic baseline prediction engine", () => {
  it("normalizes probabilities and keeps a winning score compatible with the outcome", () => {
    const prediction = buildPrediction(predictionInput());
    expect(
      prediction.teamAWinProbability +
        prediction.drawProbability +
        prediction.teamBWinProbability,
    ).toBeCloseTo(1, 6);
    expect(prediction.selectedOutcome).toBe("team_a");
    expect(prediction.predictedScoreA90).toBeGreaterThan(
      prediction.predictedScoreB90,
    );
  });

  it("selects a compatible draw score for balanced group-stage inputs", () => {
    const balanced = predictionInput({ teamB: predictionInput().teamA });
    const prediction = buildPrediction(balanced);
    expect(prediction.selectedOutcome).toBe("draw");
    expect(prediction.predictedScoreA90).toBe(prediction.predictedScoreB90);
    expect(prediction.predictedAdvancingTeamId).toBeNull();
  });

  it("selects a winner when validated ratings have a meaningful gap", () => {
    const closeButDistinct = predictionInput({
      teamB: {
        ...predictionInput().teamA,
        longTermStrength: 0.55,
      },
    });
    const prediction = buildPrediction(closeButDistinct);

    expect(prediction.selectedOutcome).toBe("team_a");
    expect(prediction.teamAWinProbability).toBeGreaterThan(
      prediction.drawProbability,
    );
    expect(prediction.predictedScoreA90).toBeGreaterThan(
      prediction.predictedScoreB90,
    );
  });

  it("stores a separate advancing team for a knockout 90-minute draw", () => {
    const input = predictionInput({
      stageType: "knockout",
      teamB: {
        ...predictionInput().teamA,
        longTermStrength: 0.74,
      },
    });
    const prediction = buildPrediction(input);
    expect(prediction.selectedOutcome).toBe("draw");
    expect(prediction.predictedAdvancingTeamId).toBe(
      "00000000-0000-4000-8000-00000000000a",
    );
  });

  it("replays identical inputs and algorithm version exactly", () => {
    const first = buildPrediction(predictionInput());
    const second = buildPrediction(predictionInput());
    expect(second).toEqual(first);
    expect(first.algorithmVersion).toBe(ALGORITHM_VERSION);
    expect(first.inputSnapshotHash).toMatch(/^[a-f0-9]{64}$/);
    expect(first.animationSeed).toMatch(/^[a-f0-9]{24}$/);
  });

  it("changes the auditable snapshot when a validated input changes", () => {
    const first = buildPrediction(predictionInput());
    const second = buildPrediction(
      predictionInput({
        teamA: { ...predictionInput().teamA, recentForm: 0.71 },
      }),
    );
    expect(second.inputSnapshotHash).not.toBe(first.inputSnapshotHash);
    expect(second.animationSeed).not.toBe(first.animationSeed);
  });

  it("rejects out-of-range numerical inputs", () => {
    expect(() =>
      buildPrediction(
        predictionInput({
          teamA: { ...predictionInput().teamA, recentForm: 1.2 },
        }),
      ),
    ).toThrow();
  });
});
