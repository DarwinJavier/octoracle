import type { StaticMatch, StaticPrediction } from "@/types/public";

export const staticMatch: StaticMatch = {
  city: "Mexico City",
  groupCode: "A",
  id: "static-opening-match",
  kickoffAtUtc: "2026-06-11T19:00:00.000Z",
  matchNumber: 1,
  stage: "Group stage",
  status: "scheduled",
  teamA: {
    id: "static-mexico",
    fifaCode: "MEX",
    fifaRank: 14,
    flagAssetUrl: null,
    flagEmoji: "🇲🇽",
    name: "Mexico",
    shortName: "Mexico",
  },
  teamB: {
    id: "static-south-africa",
    fifaCode: "RSA",
    fifaRank: 60,
    flagAssetUrl: null,
    flagEmoji: "🇿🇦",
    name: "South Africa",
    shortName: "South Africa",
  },
  venue: "Mexico City Stadium",
};

export const staticPrediction: StaticPrediction = {
  animationSeed: "opening-match-mex-rsa-v1",
  confidence: "medium",
  drawProbability: 0.25,
  freezeAt: staticMatch.kickoffAtUtc,
  frozenAt: null,
  generatedAt: "2026-06-09T14:00:00.000Z",
  predictedScoreA90: 2,
  predictedScoreB90: 1,
  predictedAdvancingTeamId: null,
  publicExplanation:
    "This illustrative baseline favors Mexico through home conditions and assumed team strength, while preserving meaningful draw and South Africa chances.",
  reasonCodes: [
    "Illustrative baseline",
    "Home conditions",
    "Competitive draw risk",
  ],
  selectedOutcome: "team_a",
  sourceCount: 0,
  status: "published",
  teamAWinProbability: 0.52,
  teamBWinProbability: 0.23,
  version: 1,
};
