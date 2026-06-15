import { describe, expect, it } from "vitest";

import type { NormalizedFixture } from "@/lib/fixtures/types";
import {
  buildDuePredictions,
  buildLivePrediction,
  type PredictionBuildRepository,
} from "@/lib/prediction/live";
import type { BuiltPrediction, PredictionInput } from "@/lib/prediction/types";
import { predictionInput } from "../fixtures/prediction-input";

const historyFixture: NormalizedFixture = {
  providerId: "history-1",
  officialMatchNumber: null,
  stage: "Friendly",
  groupCode: null,
  teamA: {
    providerId: "provider-a",
    name: "Team A",
    shortName: "A",
    fifaCode: "AAA",
    flagAssetUrl: null,
  },
  teamB: {
    providerId: "opponent",
    name: "Opponent",
    shortName: "OPP",
    fifaCode: "OPP",
    flagAssetUrl: null,
  },
  teamAPlaceholder: null,
  teamBPlaceholder: null,
  kickoffAtUtc: "2026-06-01T18:00:00.000Z",
  venue: null,
  city: null,
  status: "finished",
  scoreA90: 2,
  scoreB90: 0,
  scoreAFinal: 2,
  scoreBFinal: 0,
  winnerProviderTeamId: "provider-a",
  lastProviderUpdateAt: "2026-06-01T20:00:00.000Z",
};

class MemoryRepository implements PredictionBuildRepository {
  snapshot:
    | {
        inputHash: string;
        teamAHistory: string[];
        teamBHistory: string[];
      }
    | undefined;

  async getBuildContext() {
    return {
      matchId: predictionInput().matchId,
      kickoffAtUtc: predictionInput().kickoffAtUtc,
      stage: "Group stage",
      groupCode: "A",
      status: "scheduled" as const,
      teamA: {
        id: predictionInput().teamAId,
        providerId: "provider-a",
        name: "Team A",
      },
      teamB: {
        id: predictionInput().teamBId,
        providerId: "provider-b",
        name: "Team B",
      },
    };
  }

  async listObservations() {
    return [];
  }

  async publishVersion(prediction: BuiltPrediction, generatedAt: string) {
    return {
      ...prediction,
      id: "00000000-0000-4000-8000-000000000099",
      version: 1,
      status: "published" as const,
      generatedAt,
      frozenAt: null,
    };
  }

  async saveSignalSnapshot(
    _input: PredictionInput,
    prediction: BuiltPrediction,
    _calculatedAt: string,
    history: { teamA: NormalizedFixture[]; teamB: NormalizedFixture[] },
  ) {
    this.snapshot = {
      inputHash: prediction.inputSnapshotHash,
      teamAHistory: history.teamA.map((fixture) => fixture.providerId),
      teamBHistory: history.teamB.map((fixture) => fixture.providerId),
    };
  }

  async freezeDue() {
    return 0;
  }

  async voidFrozenForMatch() {
    return 0;
  }
}

describe("live prediction build", () => {
  it("calculates history signals, publishes, and saves the audit snapshot", async () => {
    const repository = new MemoryRepository();
    const result = await buildLivePrediction(
      predictionInput().matchId,
      {
        async fetchCompletedTeamMatches(teamProviderId) {
          return teamProviderId === "provider-a" ? [historyFixture] : [];
        },
      },
      repository,
      new Date("2026-06-11T17:00:00.000Z"),
    );

    expect(result.prediction.status).toBe("published");
    expect(result.historyMatchesRead).toBe(1);
    expect(repository.snapshot).toEqual({
      inputHash: result.prediction.inputSnapshotHash,
      teamAHistory: ["history-1"],
      teamBHistory: [],
    });
  });

  it("publishes every due candidate through the protected build flow", async () => {
    const repository = new MemoryRepository() as MemoryRepository & {
      listPredictionBuildCandidates: () => Promise<string[]>;
    };
    repository.listPredictionBuildCandidates = async () => [
      predictionInput().matchId,
    ];

    const result = await buildDuePredictions(
      {
        async fetchCompletedTeamMatches(teamProviderId) {
          return teamProviderId === "provider-a" ? [historyFixture] : [];
        },
      },
      repository,
      new Date("2026-06-11T17:00:00.000Z"),
    );

    expect(result).toEqual({
      built: [predictionInput().matchId],
      failed: [],
    });
    expect(repository.snapshot?.inputHash).toBeTruthy();
  });

  it("bounds each sync batch so scheduled builds finish reliably", async () => {
    const repository = new MemoryRepository() as MemoryRepository & {
      listPredictionBuildCandidates: () => Promise<string[]>;
    };
    const matchIds = Array.from(
      { length: 6 },
      (_, index) =>
        `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
    );
    repository.listPredictionBuildCandidates = async () => matchIds;

    const result = await buildDuePredictions(
      {
        async fetchCompletedTeamMatches() {
          return [];
        },
      },
      repository,
      new Date("2026-06-11T17:00:00.000Z"),
    );

    expect(result.built).toHaveLength(4);
    expect(result.failed).toHaveLength(0);
  });
});
