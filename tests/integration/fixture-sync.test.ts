import { describe, expect, it } from "vitest";

import {
  syncFixtures,
  type FixtureRepository,
  type SyncResult,
} from "@/lib/fixtures/sync";
import type {
  FixtureProvider,
  NormalizedFixture,
  NormalizedTeam,
} from "@/lib/fixtures/types";

function normalizedFixture(): NormalizedFixture {
  return {
    providerId: "1001",
    officialMatchNumber: 1,
    stage: "Group Stage",
    groupCode: "A",
    teamA: {
      providerId: "10",
      name: "Mexico",
      shortName: "MEX",
      fifaCode: "MEX",
      flagAssetUrl: null,
    },
    teamB: {
      providerId: "20",
      name: "South Africa",
      shortName: "RSA",
      fifaCode: "RSA",
      flagAssetUrl: null,
    },
    teamAPlaceholder: null,
    teamBPlaceholder: null,
    kickoffAtUtc: "2026-06-11T19:00:00.000Z",
    venue: "Mexico City Stadium",
    city: "Mexico City",
    status: "scheduled",
    scoreA90: null,
    scoreB90: null,
    scoreAFinal: null,
    scoreBFinal: null,
    winnerProviderTeamId: null,
    lastProviderUpdateAt: "2026-06-09T14:00:00.000Z",
  };
}

class MemoryRepository implements FixtureRepository {
  runs = new Map<string, SyncResult>();
  teamWrites = 0;
  fixtureWrites = 0;
  lockCalls = 0;
  failedRuns = 0;

  async findCompletedRun(runKey: string) {
    return this.runs.get(runKey) ?? null;
  }
  async withJobLock<T>(_jobName: string, work: () => Promise<T>) {
    this.lockCalls += 1;
    return work();
  }
  async upsertTeams(teams: NormalizedTeam[]) {
    this.teamWrites += teams.length;
    return teams.length;
  }
  async upsertFixtures(fixtures: NormalizedFixture[]) {
    this.fixtureWrites += fixtures.length;
    return fixtures.length;
  }
  async recordCompletedRun(result: SyncResult) {
    this.runs.set(result.runKey, result);
  }
  async recordFailedRun() {
    this.failedRuns += 1;
  }
}

describe("fixture synchronization", () => {
  it("upserts fixtures once and skips a repeated idempotency key", async () => {
    const repository = new MemoryRepository();
    const provider: FixtureProvider = {
      fetchFixtures: async () => [normalizedFixture()],
    };

    const first = await syncFixtures(provider, repository, "fixture-run-001");
    const second = await syncFixtures(provider, repository, "fixture-run-001");

    expect(first).toMatchObject({
      status: "succeeded",
      recordsRead: 1,
      recordsWritten: 3,
    });
    expect(second.status).toBe("skipped");
    expect(repository.lockCalls).toBe(1);
    expect(repository.teamWrites).toBe(2);
    expect(repository.fixtureWrites).toBe(1);
  });

  it("does not write or record success when the provider is unavailable", async () => {
    const repository = new MemoryRepository();
    const provider: FixtureProvider = {
      fetchFixtures: async () => {
        throw new Error("provider unavailable");
      },
    };

    await expect(
      syncFixtures(provider, repository, "fixture-run-002"),
    ).rejects.toThrow("provider unavailable");
    expect(repository.teamWrites).toBe(0);
    expect(repository.fixtureWrites).toBe(0);
    expect(repository.runs.size).toBe(0);
    expect(repository.failedRuns).toBe(1);
  });
});
