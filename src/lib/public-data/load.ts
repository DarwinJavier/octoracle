import { staticMatch, staticPrediction } from "@/lib/static-match";
import type { DailyMatchItem } from "@/components/match/DailyMatchSelector";
import {
  getFeaturedMatchResponse,
  publicStateFor,
  toPublicMatch,
} from "./service";
import { SupabasePublicDataRepository } from "./supabase-repository";
import {
  loadProviderDayMatches,
  loadProviderPreview,
} from "./provider-preview";
import {
  featuredMatchResponseSchema,
  type FeaturedMatchResponse,
  type PublicExperienceState,
} from "@/types/public";

export function demoFeaturedMatch(
  state: PublicExperienceState = "upcoming",
): FeaturedMatchResponse {
  return featuredMatchResponseSchema.parse({
    dataSource: "demo",
    state,
    match: state === "tournament_complete" ? null : staticMatch,
    prediction: ["not_ready", "provider_error", "tournament_complete"].includes(
      state,
    )
      ? null
      : {
          ...staticPrediction,
          status: state === "in_progress" ? "frozen" : staticPrediction.status,
          frozenAt: state === "in_progress" ? staticMatch.kickoffAtUtc : null,
        },
    alsoStarting: [],
    warning:
      state === "stale"
        ? "The schedule may be stale. Showing the latest validated stored fixture."
        : null,
  });
}

export function createPublicDataRepository() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;
  return new SupabasePublicDataRepository({ supabaseUrl, serviceRoleKey });
}

export async function loadFeaturedMatch(
  selectedMatchId?: string,
): Promise<FeaturedMatchResponse> {
  const repository = createPublicDataRepository();
  const footballDataApiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!repository) {
    if (footballDataApiKey) {
      try {
        return await loadProviderPreview(
          footballDataApiKey,
          new Date(),
          Number(process.env.FIXTURE_STALE_MINUTES ?? 30),
          selectedMatchId,
        );
      } catch {
        return demoFeaturedMatch();
      }
    }
    return demoFeaturedMatch();
  }
  try {
    if (selectedMatchId) {
      const selected = await loadMatch(selectedMatchId);
      if (selected?.match) return selected;
      if (footballDataApiKey) {
        try {
          return await loadProviderPreview(
            footballDataApiKey,
            new Date(),
            Number(process.env.FIXTURE_STALE_MINUTES ?? 30),
            selectedMatchId,
          );
        } catch {
          // Continue to the stored featured match before reporting an error.
        }
      }
    }
    const stored = await getFeaturedMatchResponse(
      repository,
      new Date(),
      Number(process.env.FIXTURE_STALE_MINUTES ?? 30),
    );
    if (stored.match || !footballDataApiKey) return stored;
    try {
      return await loadProviderPreview(
        footballDataApiKey,
        new Date(),
        Number(process.env.FIXTURE_STALE_MINUTES ?? 30),
      );
    } catch {
      return stored;
    }
  } catch {
    if (footballDataApiKey) {
      try {
        return await loadProviderPreview(
          footballDataApiKey,
          new Date(),
          Number(process.env.FIXTURE_STALE_MINUTES ?? 30),
          selectedMatchId,
        );
      } catch {
        // Fall through to the honest provider error below.
      }
    }
    return featuredMatchResponseSchema.parse({
      dataSource: "stored",
      state: "provider_error",
      match: null,
      prediction: null,
      alsoStarting: [],
      warning: "Stored fixture data could not be read safely.",
    });
  }
}

export async function loadDailyMatches(response: FeaturedMatchResponse) {
  const footballDataApiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (footballDataApiKey) {
    try {
      const providerMatches = await loadProviderDayMatches(
        footballDataApiKey,
        response.match?.kickoffAtUtc ?? new Date().toISOString(),
      );
      if (providerMatches.length > 0) return providerMatches;
    } catch {
      // Fall back to the validated stored response below.
    }
  }

  if (!response.match) return [];
  const repository = createPublicDataRepository();
  if (!repository) return [{ match: response.match, result: response.result }];
  try {
    const day = response.match.kickoffAtUtc.slice(0, 10);
    return (await repository.listFixtures())
      .filter((fixture) => fixture.kickoffAtUtc?.startsWith(day))
      .map(toPublicMatch)
      .filter((match) => match !== null)
      .map((match) => ({ match, result: null })) satisfies DailyMatchItem[];
  } catch {
    return [{ match: response.match, result: response.result }];
  }
}

export async function loadMatch(
  matchId: string,
): Promise<FeaturedMatchResponse | null> {
  const repository = createPublicDataRepository();
  if (!repository)
    return matchId === staticMatch.id ? demoFeaturedMatch() : null;
  try {
    const fixture = (await repository.listFixtures()).find(
      (item) => item.providerId === matchId,
    );
    if (!fixture) return null;
    const prediction = await repository.getPublishedPrediction(matchId);
    return featuredMatchResponseSchema.parse({
      dataSource: "stored",
      state: publicStateFor(fixture, prediction !== null, false),
      match: toPublicMatch(fixture),
      prediction,
      alsoStarting: [],
      warning: null,
    });
  } catch {
    return featuredMatchResponseSchema.parse({
      dataSource: "stored",
      state: "provider_error",
      match: null,
      prediction: null,
      alsoStarting: [],
      warning: "Stored fixture data could not be read safely.",
    });
  }
}
