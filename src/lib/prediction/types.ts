import { z } from "zod";

const unitValue = z.number().min(0).max(1);

export const teamSignalsSchema = z
  .object({
    longTermStrength: unitValue,
    recentForm: unitValue,
    attackingPerformance: unitValue,
    defensivePerformance: unitValue,
    squadAvailability: unitValue,
    publicConsensus: unitValue,
  })
  .strict();

export const predictionInputSchema = z
  .object({
    matchId: z.string().uuid(),
    stageType: z.enum(["group", "knockout"]),
    teamAId: z.string().uuid(),
    teamAName: z.string().min(1),
    teamBId: z.string().uuid(),
    teamBName: z.string().min(1),
    teamA: teamSignalsSchema,
    teamB: teamSignalsSchema,
    sourceCount: z.number().int().nonnegative(),
    kickoffAtUtc: z.string().datetime(),
  })
  .strict();

export type PredictionInput = z.infer<typeof predictionInputSchema>;
export type SelectedOutcome = "team_a" | "draw" | "team_b";
export type Confidence = "low" | "medium" | "high";

export type BuiltPrediction = {
  matchId: string;
  teamAWinProbability: number;
  drawProbability: number;
  teamBWinProbability: number;
  expectedGoalsA: number;
  expectedGoalsB: number;
  predictedScoreA90: number;
  predictedScoreB90: number;
  predictedAdvancingTeamId: string | null;
  selectedOutcome: SelectedOutcome;
  confidence: Confidence;
  reasonCodes: string[];
  publicExplanation: string;
  sourceCount: number;
  freezeAt: string;
  animationSeed: string;
  modelVersion: string;
  algorithmVersion: string;
  inputSnapshotHash: string;
};

export type StoredPrediction = BuiltPrediction & {
  id: string;
  version: number;
  status: "draft" | "published" | "frozen" | "superseded" | "void";
  generatedAt: string;
  frozenAt: string | null;
};
