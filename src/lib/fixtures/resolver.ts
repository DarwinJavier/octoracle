import type {
  FixtureResolution,
  MatchStatus,
  NormalizedFixture,
} from "./types";

const ACTIVE_STATUSES = new Set<MatchStatus>(["live", "halftime", "suspended"]);
const EXCLUDED_SCHEDULED_STATUSES = new Set<MatchStatus>([
  "finished",
  "finished_after_extra_time",
  "finished_after_penalties",
  "postponed",
  "cancelled",
  "abandoned",
]);

function compareFixtures(left: NormalizedFixture, right: NormalizedFixture) {
  const kickoffComparison = (left.kickoffAtUtc ?? "").localeCompare(
    right.kickoffAtUtc ?? "",
  );
  if (kickoffComparison !== 0) return kickoffComparison;

  const leftNumber = left.officialMatchNumber ?? Number.MAX_SAFE_INTEGER;
  const rightNumber = right.officialMatchNumber ?? Number.MAX_SAFE_INTEGER;
  if (leftNumber !== rightNumber) return leftNumber - rightNumber;

  return left.providerId.localeCompare(right.providerId, "en");
}

function isStale(
  match: NormalizedFixture | null,
  now: Date,
  staleMinutes: number,
) {
  if (!match) return false;
  return (
    now.getTime() - Date.parse(match.lastProviderUpdateAt) >
    staleMinutes * 60_000
  );
}

function resolution(
  match: NormalizedFixture | null,
  candidates: NormalizedFixture[],
  now: Date,
  staleMinutes: number,
): FixtureResolution {
  const alsoStarting = match
    ? candidates.filter(
        (candidate) =>
          candidate.providerId !== match.providerId &&
          candidate.kickoffAtUtc === match.kickoffAtUtc,
      )
    : [];

  return {
    match,
    alsoStarting,
    stale: isStale(match, now, staleMinutes),
    tournamentComplete: match === null,
  };
}

export function resolveNextScheduledMatch(
  fixtures: NormalizedFixture[],
  now: Date,
  staleMinutes: number,
): FixtureResolution {
  const candidates = fixtures
    .filter(
      (fixture) =>
        fixture.status === "scheduled" &&
        !EXCLUDED_SCHEDULED_STATUSES.has(fixture.status) &&
        fixture.kickoffAtUtc !== null &&
        Date.parse(fixture.kickoffAtUtc) > now.getTime(),
    )
    .sort(compareFixtures);

  return resolution(candidates[0] ?? null, candidates, now, staleMinutes);
}

export function resolveFeaturedMatch(
  fixtures: NormalizedFixture[],
  now: Date,
  staleMinutes: number,
): FixtureResolution {
  const active = fixtures
    .filter((fixture) => ACTIVE_STATUSES.has(fixture.status))
    .sort(compareFixtures);

  if (active.length > 0) {
    return resolution(active[0], active, now, staleMinutes);
  }

  return resolveNextScheduledMatch(fixtures, now, staleMinutes);
}
