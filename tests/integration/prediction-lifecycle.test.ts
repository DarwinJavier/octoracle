import { describe, expect, it } from "vitest";

import {
  freezeDuePredictions,
  publishPrediction,
  reconcileFrozenPrediction,
  type PredictionFixtureState,
  type PredictionRepository,
} from "@/lib/prediction/lifecycle";
import type { BuiltPrediction, StoredPrediction } from "@/lib/prediction/types";
import { predictionInput } from "../fixtures/prediction-input";

class MemoryPredictionRepository implements PredictionRepository {
  predictions: StoredPrediction[] = [];

  async publishVersion(prediction: BuiltPrediction, generatedAt: string) {
    for (const existing of this.predictions) {
      if (
        existing.matchId === prediction.matchId &&
        existing.status === "published"
      ) {
        existing.status = "superseded";
      }
    }
    const stored: StoredPrediction = {
      ...prediction,
      id: `prediction-${this.predictions.length + 1}`,
      version:
        this.predictions.filter((item) => item.matchId === prediction.matchId)
          .length + 1,
      status: "published",
      generatedAt,
      frozenAt: null,
    };
    this.predictions.push(stored);
    return stored;
  }

  async freezeDue(now: string) {
    let count = 0;
    for (const prediction of this.predictions) {
      if (prediction.status === "published" && prediction.freezeAt <= now) {
        prediction.status = "frozen";
        prediction.frozenAt = now;
        count += 1;
      }
    }
    return count;
  }

  async voidFrozenForMatch(matchId: string) {
    let count = 0;
    for (const prediction of this.predictions) {
      if (prediction.matchId === matchId && prediction.status === "frozen") {
        prediction.status = "void";
        count += 1;
      }
    }
    return count;
  }
}

const fixture: PredictionFixtureState = {
  matchId: "00000000-0000-4000-8000-000000000001",
  kickoffAtUtc: "2026-06-11T19:00:00.000Z",
  status: "scheduled",
};

describe("prediction lifecycle", () => {
  it("creates auditable versions and supersedes without overwriting history", async () => {
    const repository = new MemoryPredictionRepository();
    const first = await publishPrediction(
      predictionInput(),
      fixture,
      repository,
      new Date("2026-06-11T17:00:00.000Z"),
    );
    const second = await publishPrediction(
      predictionInput({
        teamA: { ...predictionInput().teamA, recentForm: 0.74 },
      }),
      fixture,
      repository,
      new Date("2026-06-11T18:00:00.000Z"),
    );
    expect(first.status).toBe("superseded");
    expect(second.version).toBe(2);
    expect(repository.predictions[0].inputSnapshotHash).not.toBe(
      second.inputSnapshotHash,
    );
  });

  it("freezes published predictions exactly at kickoff and rejects later publication", async () => {
    const repository = new MemoryPredictionRepository();
    await publishPrediction(
      predictionInput(),
      fixture,
      repository,
      new Date("2026-06-11T18:00:00.000Z"),
    );
    expect(
      await freezeDuePredictions(
        repository,
        new Date("2026-06-11T18:59:59.999Z"),
      ),
    ).toBe(0);
    expect(
      await freezeDuePredictions(repository, new Date(fixture.kickoffAtUtc!)),
    ).toBe(1);
    await expect(
      publishPrediction(
        predictionInput(),
        fixture,
        repository,
        new Date(fixture.kickoffAtUtc!),
      ),
    ).rejects.toThrow("prediction_frozen");
  });

  it("voids a frozen prediction after postponement or kickoff correction", async () => {
    const repository = new MemoryPredictionRepository();
    await publishPrediction(
      predictionInput(),
      fixture,
      repository,
      new Date("2026-06-11T18:00:00.000Z"),
    );
    await freezeDuePredictions(repository, new Date(fixture.kickoffAtUtc!));
    expect(
      await reconcileFrozenPrediction(
        { ...fixture, status: "postponed" },
        fixture.kickoffAtUtc!,
        repository,
      ),
    ).toBe(1);
    expect(repository.predictions[0].status).toBe("void");
  });

  it("rejects stale kickoff snapshots and non-scheduled fixtures", async () => {
    const repository = new MemoryPredictionRepository();
    await expect(
      publishPrediction(
        predictionInput(),
        { ...fixture, kickoffAtUtc: "2026-06-11T20:00:00.000Z" },
        repository,
        new Date("2026-06-11T18:00:00.000Z"),
      ),
    ).rejects.toThrow("stale_kickoff_input");
    await expect(
      publishPrediction(
        predictionInput(),
        { ...fixture, status: "cancelled" },
        repository,
        new Date("2026-06-11T18:00:00.000Z"),
      ),
    ).rejects.toThrow("match_not_prediction_eligible");
  });
});
