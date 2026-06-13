import { z } from "zod";

import {
  normalizedFixtureSchema,
  type FixtureProvider,
  type MatchStatus,
  type NormalizedFixture,
  type NormalizedTeam,
} from "../types";
import { verifiedLocationFor } from "../verified-locations";

const scorePairSchema = z
  .object({
    home: z.number().int().nonnegative().nullable(),
    away: z.number().int().nonnegative().nullable(),
  })
  .strict();

const teamSchema = z
  .object({
    id: z.number().int().positive().nullable(),
    name: z.string().min(1).nullable(),
    shortName: z.string().min(1).nullable().optional(),
    tla: z.string().min(2).max(4).nullable().optional(),
    crest: z.string().url().nullable().optional(),
  })
  .passthrough();

const matchSchema = z
  .object({
    id: z.number().int().positive(),
    utcDate: z.string().datetime(),
    status: z.string().min(1),
    matchday: z.number().int().positive().nullable().optional(),
    stage: z.string().min(1),
    group: z.string().min(1).nullable().optional(),
    lastUpdated: z.string().datetime(),
    venue: z.string().min(1).nullable().optional(),
    homeTeam: teamSchema,
    awayTeam: teamSchema,
    score: z
      .object({
        winner: z.enum(["HOME_TEAM", "AWAY_TEAM", "DRAW"]).nullable(),
        duration: z
          .enum(["REGULAR", "EXTRA_TIME", "PENALTY_SHOOTOUT"])
          .nullable(),
        fullTime: scorePairSchema.optional(),
        regularTime: scorePairSchema.optional(),
        penalties: scorePairSchema.optional(),
      })
      .passthrough(),
  })
  .passthrough();

const envelopeSchema = z
  .object({
    matches: z.array(matchSchema),
  })
  .passthrough();

const STATUS_MAP: Record<string, MatchStatus> = {
  SCHEDULED: "scheduled",
  TIMED: "scheduled",
  IN_PLAY: "live",
  PAUSED: "halftime",
  FINISHED: "finished",
  SUSPENDED: "suspended",
  POSTPONED: "postponed",
  CANCELLED: "cancelled",
  AWARDED: "finished",
};

const STAGE_LABELS: Record<string, string> = {
  GROUP_STAGE: "Group stage",
  LAST_32: "Round of 32",
  LAST_16: "Round of 16",
  QUARTER_FINALS: "Quarter-finals",
  SEMI_FINALS: "Semi-finals",
  THIRD_PLACE: "Third-place match",
  FINAL: "Final",
};

function toTeam(input: z.infer<typeof teamSchema>): NormalizedTeam | null {
  if (!input.id || !input.name) return null;
  return {
    providerId: String(input.id),
    name: input.name,
    shortName: input.shortName ?? input.tla ?? null,
    fifaCode: input.tla ?? null,
    flagAssetUrl: input.crest ?? null,
  };
}

function groupCode(group: string | null | undefined) {
  if (!group) return null;
  return group.replace(/^GROUP_/, "");
}

function winnerTeamId(
  winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null,
  home: NormalizedTeam | null,
  away: NormalizedTeam | null,
) {
  if (winner === "HOME_TEAM") return home?.providerId ?? null;
  if (winner === "AWAY_TEAM") return away?.providerId ?? null;
  return null;
}

function finishedStatus(
  status: MatchStatus,
  duration: "REGULAR" | "EXTRA_TIME" | "PENALTY_SHOOTOUT" | null,
): MatchStatus {
  if (status !== "finished") return status;
  if (duration === "PENALTY_SHOOTOUT") return "finished_after_penalties";
  if (duration === "EXTRA_TIME") return "finished_after_extra_time";
  return "finished";
}

export function normalizeFootballDataFixture(
  input: unknown,
): NormalizedFixture {
  const match = matchSchema.parse(input);
  const verifiedLocation = verifiedLocationFor(String(match.id));
  const home = toTeam(match.homeTeam);
  const away = toTeam(match.awayTeam);
  const status = finishedStatus(
    STATUS_MAP[match.status] ?? "unknown",
    match.score.duration,
  );
  const isFinished = status.startsWith("finished");
  const regularTime =
    match.score.regularTime ??
    (match.score.duration === "REGULAR" ? match.score.fullTime : undefined);
  const finalScore =
    match.score.duration === "PENALTY_SHOOTOUT"
      ? (match.score.penalties ?? match.score.fullTime)
      : match.score.fullTime;

  return normalizedFixtureSchema.parse({
    providerId: String(match.id),
    officialMatchNumber: match.matchday ?? null,
    stage: STAGE_LABELS[match.stage] ?? match.stage.replaceAll("_", " "),
    groupCode: groupCode(match.group),
    teamA: home,
    teamB: away,
    teamAPlaceholder: home ? null : (match.homeTeam.name ?? "Team A TBD"),
    teamBPlaceholder: away ? null : (match.awayTeam.name ?? "Team B TBD"),
    kickoffAtUtc: match.utcDate,
    venue: match.venue ?? verifiedLocation?.venue ?? null,
    city: match.venue ? null : (verifiedLocation?.city ?? null),
    status,
    scoreA90: isFinished ? (regularTime?.home ?? null) : null,
    scoreB90: isFinished ? (regularTime?.away ?? null) : null,
    scoreAFinal: isFinished ? (finalScore?.home ?? null) : null,
    scoreBFinal: isFinished ? (finalScore?.away ?? null) : null,
    winnerProviderTeamId: isFinished
      ? winnerTeamId(match.score.winner, home, away)
      : null,
    lastProviderUpdateAt: match.lastUpdated,
  });
}

export function parseFootballDataResponse(input: unknown) {
  return envelopeSchema
    .parse(input)
    .matches.map((match) => normalizeFootballDataFixture(match));
}

type FootballDataProviderOptions = {
  apiKey: string;
  fetchImplementation?: typeof fetch;
  timeoutMs?: number;
};

const teamProviderIdSchema = z.string().regex(/^\d+$/);

export class FootballDataFixtureProvider implements FixtureProvider {
  private readonly fetchImplementation: typeof fetch;
  private readonly timeoutMs: number;

  constructor(private readonly options: FootballDataProviderOptions) {
    this.fetchImplementation = options.fetchImplementation ?? fetch;
    this.timeoutMs = options.timeoutMs ?? 10_000;
  }

  async fetchFixtures() {
    const url = new URL(
      "https://api.football-data.org/v4/competitions/WC/matches",
    );
    url.searchParams.set("season", "2026");
    url.searchParams.set("dateFrom", "2026-06-11");
    url.searchParams.set("dateTo", "2026-07-20");

    const response = await this.fetchImplementation(url, {
      headers: {
        Accept: "application/json",
        "X-Auth-Token": this.options.apiKey,
      },
      signal: AbortSignal.timeout(this.timeoutMs),
      cache: "force-cache",
      next: { revalidate: 60 },
    });
    if (!response.ok) {
      throw new Error(
        `football-data.org request failed with status ${response.status}`,
      );
    }
    return parseFootballDataResponse(await response.json());
  }

  async fetchCompletedTeamMatches(
    teamProviderId: string,
    before: string,
    limit = 20,
  ) {
    const teamId = teamProviderIdSchema.parse(teamProviderId);
    const cutoff = z.string().datetime().parse(before);
    const boundedLimit = z.number().int().min(1).max(100).parse(limit);
    const url = new URL(
      `https://api.football-data.org/v4/teams/${teamId}/matches`,
    );
    const historyStart = new Date(cutoff);
    historyStart.setUTCFullYear(historyStart.getUTCFullYear() - 2);
    url.searchParams.set("status", "FINISHED");
    url.searchParams.set("dateFrom", historyStart.toISOString().slice(0, 10));
    url.searchParams.set("dateTo", cutoff.slice(0, 10));

    const response = await this.fetchImplementation(url, {
      headers: {
        Accept: "application/json",
        "X-Auth-Token": this.options.apiKey,
      },
      signal: AbortSignal.timeout(this.timeoutMs),
      cache: "force-cache",
      next: { revalidate: 21_600 },
    });
    if (!response.ok) {
      throw new Error(
        `football-data.org team matches request failed with status ${response.status}`,
      );
    }
    return parseFootballDataResponse(await response.json())
      .filter(
        (fixture) =>
          fixture.kickoffAtUtc &&
          Date.parse(fixture.kickoffAtUtc) < Date.parse(cutoff),
      )
      .sort(
        (left, right) =>
          Date.parse(right.kickoffAtUtc ?? "") -
          Date.parse(left.kickoffAtUtc ?? ""),
      )
      .slice(0, boundedLimit);
  }
}
