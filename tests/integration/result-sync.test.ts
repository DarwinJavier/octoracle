import { describe, expect, it } from "vitest";

import { syncResults, type ResultRepository } from "@/lib/results/service";
import type { FinalResult } from "@/lib/results/types";
import type { NormalizedFixture } from "@/lib/fixtures/types";

class MemoryResultRepository implements ResultRepository {
  revisions: FinalResult[] = [];
  async applyResults(results: FinalResult[]) {
    this.revisions.push(...results);
    return results.length;
  }
}

const fixture = {
  providerId: "match-1",
  officialMatchNumber: 1,
  stage: "Round of 16",
  groupCode: null,
  teamA: {
    providerId: "a",
    name: "A",
    shortName: "A",
    fifaCode: "AAA",
    flagAssetUrl: null,
  },
  teamB: {
    providerId: "b",
    name: "B",
    shortName: "B",
    fifaCode: "BBB",
    flagAssetUrl: null,
  },
  teamAPlaceholder: null,
  teamBPlaceholder: null,
  kickoffAtUtc: "2026-06-30T19:00:00.000Z",
  venue: "Venue",
  city: "City",
  status: "finished_after_extra_time",
  scoreA90: 1,
  scoreB90: 1,
  scoreAFinal: 2,
  scoreBFinal: 1,
  winnerProviderTeamId: "a",
  lastProviderUpdateAt: "2026-06-30T22:00:00.000Z",
} satisfies NormalizedFixture;

describe("result synchronization", () => {
  it("writes only completed results and preserves corrections as separate revisions", async () => {
    const repository = new MemoryResultRepository();
    await syncResults([fixture], repository);
    await syncResults(
      [
        {
          ...fixture,
          scoreAFinal: 3,
          lastProviderUpdateAt: "2026-06-30T22:05:00.000Z",
        },
      ],
      repository,
    );
    expect(repository.revisions).toHaveLength(2);
    expect(repository.revisions[0].scoreAFinal).toBe(2);
    expect(repository.revisions[1].scoreAFinal).toBe(3);
  });
});
