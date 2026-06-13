import { createHash } from "node:crypto";

import { FootballDataFixtureProvider } from "@/lib/fixtures/providers/football-data";
import { resolveFeaturedMatch } from "@/lib/fixtures/resolver";
import type { NormalizedFixture } from "@/lib/fixtures/types";
import { buildPrediction } from "@/lib/prediction/engine";
import { MIN_HISTORY_MATCHES } from "@/lib/prediction/config";
import { calculateHistorySignals } from "@/lib/prediction/signals/history";
import {
  recordedPreviewPredictionFor,
  recordedPreviewPredictionIds,
} from "@/lib/prediction/preview-ledger";
import { calculatePredictionAccuracy } from "@/lib/results/service";
import { predictionHistoryItemSchema } from "@/types/public";
import type { PredictionInput } from "@/lib/prediction/types";
import {
  featuredMatchResponseSchema,
  publicPredictionSchema,
  type FeaturedMatchResponse,
} from "@/types/public";
import { publicStateFor, toPublicMatch } from "./service";

const PREVIEW_WARNING =
  "Live fixture preview from football-data.org. This deterministic prediction is not stored or frozen yet.";

function stableUuid(value: string) {
  const hash = createHash("sha256").update(value).digest("hex").slice(0, 32);
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-8${hash.slice(17, 20)}-${hash.slice(20)}`;
}

function stageType(fixture: NormalizedFixture) {
  return fixture.groupCode || fixture.stage.toLowerCase().includes("group")
    ? ("group" as const)
    : ("knockout" as const);
}

async function historyOrEmpty(
  provider: FootballDataFixtureProvider,
  teamProviderId: string,
  kickoffAtUtc: string,
) {
  try {
    return await provider.fetchCompletedTeamMatches(
      teamProviderId,
      kickoffAtUtc,
    );
  } catch {
    return [];
  }
}

async function previewPrediction(
  provider: FootballDataFixtureProvider,
  fixture: NormalizedFixture,
  now: Date,
) {
  if (
    fixture.status !== "scheduled" ||
    !fixture.kickoffAtUtc ||
    !fixture.teamA ||
    !fixture.teamB ||
    now.getTime() >= Date.parse(fixture.kickoffAtUtc)
  ) {
    return null;
  }

  const [teamAHistory, teamBHistory] = await Promise.all([
    historyOrEmpty(provider, fixture.teamA.providerId, fixture.kickoffAtUtc),
    historyOrEmpty(provider, fixture.teamB.providerId, fixture.kickoffAtUtc),
  ]);
  if (
    teamAHistory.length < MIN_HISTORY_MATCHES ||
    teamBHistory.length < MIN_HISTORY_MATCHES
  ) {
    return null;
  }
  const teamAId = stableUuid(`team:${fixture.teamA.providerId}`);
  const teamBId = stableUuid(`team:${fixture.teamB.providerId}`);
  const input: PredictionInput = {
    matchId: stableUuid(`match:${fixture.providerId}`),
    stageType: stageType(fixture),
    teamAId,
    teamAName: fixture.teamA.name,
    teamBId,
    teamBName: fixture.teamB.name,
    teamA: calculateHistorySignals(fixture.teamA.providerId, teamAHistory),
    teamB: calculateHistorySignals(fixture.teamB.providerId, teamBHistory),
    sourceCount: 0,
    kickoffAtUtc: fixture.kickoffAtUtc,
  };
  const prediction = buildPrediction(input);

  return publicPredictionSchema.parse({
    animationSeed: prediction.animationSeed,
    confidence: prediction.confidence,
    drawProbability: prediction.drawProbability,
    freezeAt: prediction.freezeAt,
    frozenAt: null,
    generatedAt: now.toISOString(),
    predictedAdvancingTeamId:
      prediction.predictedAdvancingTeamId === teamAId
        ? fixture.teamA.providerId
        : prediction.predictedAdvancingTeamId === teamBId
          ? fixture.teamB.providerId
          : null,
    predictedScoreA90: prediction.predictedScoreA90,
    predictedScoreB90: prediction.predictedScoreB90,
    publicExplanation: prediction.publicExplanation,
    reasonCodes: prediction.reasonCodes,
    selectedOutcome: prediction.selectedOutcome,
    sourceCount: prediction.sourceCount,
    status: "published",
    teamAWinProbability: prediction.teamAWinProbability,
    teamBWinProbability: prediction.teamBWinProbability,
    version: 1,
  });
}

export function publicResult(fixture: NormalizedFixture) {
  if (
    !fixture.status.startsWith("finished") ||
    fixture.scoreA90 === null ||
    fixture.scoreB90 === null ||
    fixture.scoreAFinal === null ||
    fixture.scoreBFinal === null
  ) {
    return null;
  }
  return {
    scoreA90: fixture.scoreA90,
    scoreB90: fixture.scoreB90,
    scoreAFinal: fixture.scoreAFinal,
    scoreBFinal: fixture.scoreBFinal,
    winnerTeamId: fixture.winnerProviderTeamId,
  };
}

export async function loadRecordedProviderHistory(apiKey: string) {
  const fixtures = await new FootballDataFixtureProvider({
    apiKey,
  }).fetchFixtures();
  const recordedIds = new Set(recordedPreviewPredictionIds());

  return fixtures.flatMap((fixture) => {
    if (!recordedIds.has(fixture.providerId)) return [];
    const prediction = recordedPreviewPredictionFor(fixture.providerId);
    const match = toPublicMatch(fixture);
    const result = publicResult(fixture);
    if (!prediction || !match || !result) return [];
    return [
      predictionHistoryItemSchema.parse({
        match,
        prediction: {
          ...prediction,
          status: "frozen",
          frozenAt: prediction.frozenAt ?? prediction.freezeAt,
        },
        result,
        accuracy: calculatePredictionAccuracy(
          prediction,
          {
            matchProviderId: match.id,
            providerUpdatedAt: fixture.lastProviderUpdateAt,
            scoreA90: result.scoreA90,
            scoreB90: result.scoreB90,
            scoreAFinal: result.scoreAFinal,
            scoreBFinal: result.scoreBFinal,
            status:
              fixture.status === "finished_after_extra_time" ||
              fixture.status === "finished_after_penalties"
                ? fixture.status
                : "finished",
            winnerProviderTeamId: result.winnerTeamId,
          },
          match.teamA.id,
          match.teamB.id,
        ),
      }),
    ];
  });
}

export async function loadProviderPreview(
  apiKey: string,
  now = new Date(),
  staleMinutes = 30,
  selectedMatchId?: string,
): Promise<FeaturedMatchResponse> {
  const provider = new FootballDataFixtureProvider({ apiKey });
  const fixtures = await provider.fetchFixtures();
  const resolution = resolveFeaturedMatch(fixtures, now, staleMinutes);
  const selectedMatch = selectedMatchId
    ? fixtures.find((fixture) => fixture.providerId === selectedMatchId)
    : null;
  const featured = selectedMatch ?? resolution.match;
  if (!featured) {
    return featuredMatchResponseSchema.parse({
      dataSource: "provider_preview",
      state: "tournament_complete",
      match: null,
      prediction: null,
      alsoStarting: [],
      warning: PREVIEW_WARNING,
    });
  }

  const recordedPrediction = recordedPreviewPredictionFor(featured.providerId);
  const prediction =
    recordedPrediction ?? (await previewPrediction(provider, featured, now));
  return featuredMatchResponseSchema.parse({
    dataSource: "provider_preview",
    state: publicStateFor(
      featured,
      prediction !== null,
      selectedMatch ? false : resolution.stale,
    ),
    match: toPublicMatch(featured),
    prediction,
    result: publicResult(featured),
    alsoStarting: selectedMatch
      ? []
      : resolution.alsoStarting
          .map(toPublicMatch)
          .filter((item) => item !== null),
    warning: recordedPrediction
      ? "This revealed preview prediction is recorded for later result comparison."
      : PREVIEW_WARNING,
  });
}

export async function loadProviderDayMatches(
  apiKey: string,
  referenceKickoff: string,
) {
  const fixtures = await new FootballDataFixtureProvider({
    apiKey,
  }).fetchFixtures();
  const day = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/New_York",
    year: "numeric",
  }).format(new Date(referenceKickoff));

  return fixtures
    .filter(
      (fixture) =>
        fixture.kickoffAtUtc &&
        new Intl.DateTimeFormat("en-CA", {
          day: "2-digit",
          month: "2-digit",
          timeZone: "America/New_York",
          year: "numeric",
        }).format(new Date(fixture.kickoffAtUtc)) === day,
    )
    .map((fixture) => ({
      match: toPublicMatch(fixture),
      result: publicResult(fixture),
    }))
    .filter(
      (
        item,
      ): item is {
        match: NonNullable<ReturnType<typeof toPublicMatch>>;
        result: ReturnType<typeof publicResult>;
      } => item.match !== null,
    );
}
