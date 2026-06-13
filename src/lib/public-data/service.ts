import { resolveFeaturedMatch } from "@/lib/fixtures/resolver";
import type { NormalizedFixture, NormalizedTeam } from "@/lib/fixtures/types";
import type { PublicDataRepository } from "@/lib/public-data/repository";
import {
  featuredMatchResponseSchema,
  type FeaturedMatchResponse,
  type PublicExperienceState,
  type PublicMatch,
} from "@/types/public";

const FINISHED = new Set([
  "finished",
  "finished_after_extra_time",
  "finished_after_penalties",
]);

function emojiFor(code: string) {
  if (!/^[A-Z]{2}$/.test(code)) return "";
  return [...code]
    .map((letter) => String.fromCodePoint(127397 + letter.charCodeAt(0)))
    .join("");
}

function publicTeam(
  team: NormalizedTeam | null,
  placeholder: string | null,
  side: string,
) {
  const fifaCode = team?.fifaCode ?? "TBD";
  const flagAssetUrl =
    team?.flagAssetUrl &&
    new URL(team.flagAssetUrl).hostname === "crests.football-data.org"
      ? team.flagAssetUrl
      : null;
  return {
    id: team?.providerId ?? `placeholder-${side}`,
    fifaCode,
    flagAssetUrl,
    flagEmoji: emojiFor(fifaCode),
    name: team?.name ?? placeholder ?? `Team ${side} TBD`,
    shortName: team?.shortName ?? team?.name ?? placeholder ?? `Team ${side}`,
  };
}

export function toPublicMatch(fixture: NormalizedFixture): PublicMatch | null {
  if (!fixture.kickoffAtUtc) return null;
  return {
    city: fixture.city ?? "City to be confirmed",
    groupCode: fixture.groupCode,
    id: fixture.providerId,
    kickoffAtUtc: fixture.kickoffAtUtc,
    matchNumber: fixture.officialMatchNumber,
    stage: fixture.stage,
    status: fixture.status,
    teamA: publicTeam(fixture.teamA, fixture.teamAPlaceholder, "A"),
    teamB: publicTeam(fixture.teamB, fixture.teamBPlaceholder, "B"),
    venue: fixture.venue ?? "Venue to be confirmed",
  };
}

export function publicStateFor(
  fixture: NormalizedFixture,
  hasPrediction: boolean,
  stale: boolean,
): PublicExperienceState {
  if (stale) return "stale";
  if (FINISHED.has(fixture.status)) return "finished";
  if (["live", "halftime", "suspended"].includes(fixture.status))
    return "in_progress";
  return hasPrediction ? "upcoming" : "not_ready";
}

export async function getFeaturedMatchResponse(
  repository: PublicDataRepository,
  now = new Date(),
  staleMinutes = 30,
): Promise<FeaturedMatchResponse> {
  const fixtures = await repository.listFixtures();
  const resolution = resolveFeaturedMatch(fixtures, now, staleMinutes);
  if (!resolution.match) {
    return featuredMatchResponseSchema.parse({
      dataSource: "stored",
      state: "tournament_complete",
      match: null,
      prediction: null,
      alsoStarting: [],
      warning: null,
    });
  }

  const match = toPublicMatch(resolution.match);
  const prediction = await repository.getPublishedPrediction(
    resolution.match.providerId,
  );
  return featuredMatchResponseSchema.parse({
    dataSource: "stored",
    state: publicStateFor(
      resolution.match,
      prediction !== null,
      resolution.stale,
    ),
    match,
    prediction,
    alsoStarting: resolution.alsoStarting
      .map(toPublicMatch)
      .filter((item) => item !== null),
    warning: resolution.stale
      ? "The schedule may be stale. Showing the latest validated stored fixture."
      : null,
  });
}
