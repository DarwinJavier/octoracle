import {
  predictionInputSchema,
  type PredictionInput,
} from "@/lib/prediction/types";
import type { ConsensusSignal } from "./consensus";

export function applyConsensusToPredictionInput(
  input: PredictionInput,
  consensus: ConsensusSignal,
): PredictionInput {
  return predictionInputSchema.parse({
    ...input,
    teamA: {
      ...input.teamA,
      publicConsensus: consensus.sufficient ? consensus.teamA : 0.5,
    },
    teamB: {
      ...input.teamB,
      publicConsensus: consensus.sufficient ? consensus.teamB : 0.5,
    },
    sourceCount: consensus.sourceCount,
  });
}
