import type {
  FixtureProvider,
  NormalizedFixture,
  NormalizedTeam,
} from "./types";

export type SyncResult = {
  status: "succeeded" | "skipped";
  runKey: string;
  recordsRead: number;
  recordsWritten: number;
};

export type FixtureRepository = {
  findCompletedRun(runKey: string): Promise<SyncResult | null>;
  withJobLock<T>(jobName: string, work: () => Promise<T>): Promise<T>;
  upsertTeams(teams: NormalizedTeam[]): Promise<number>;
  upsertFixtures(fixtures: NormalizedFixture[]): Promise<number>;
  recordCompletedRun(result: SyncResult): Promise<void>;
  recordFailedRun(runKey: string, errorCode: string): Promise<void>;
};

function uniqueTeams(fixtures: NormalizedFixture[]) {
  const teams = new Map<string, NormalizedTeam>();
  for (const fixture of fixtures) {
    if (fixture.teamA) teams.set(fixture.teamA.providerId, fixture.teamA);
    if (fixture.teamB) teams.set(fixture.teamB.providerId, fixture.teamB);
  }
  return [...teams.values()];
}

export async function syncFixtures(
  provider: FixtureProvider,
  repository: FixtureRepository,
  runKey: string,
): Promise<SyncResult> {
  const previous = await repository.findCompletedRun(runKey);
  if (previous) return { ...previous, status: "skipped" };

  return repository.withJobLock("sync_fixtures", async () => {
    const afterLock = await repository.findCompletedRun(runKey);
    if (afterLock) return { ...afterLock, status: "skipped" };

    try {
      const fixtures = await provider.fetchFixtures();
      const teamWrites = await repository.upsertTeams(uniqueTeams(fixtures));
      const fixtureWrites = await repository.upsertFixtures(fixtures);
      const result: SyncResult = {
        status: "succeeded",
        runKey,
        recordsRead: fixtures.length,
        recordsWritten: teamWrites + fixtureWrites,
      };
      await repository.recordCompletedRun(result);
      return result;
    } catch (error) {
      await repository
        .recordFailedRun(runKey, "fixture_sync_failed")
        .catch(() => undefined);
      throw error;
    }
  });
}
