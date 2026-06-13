export const ALGORITHM_VERSION = "baseline-1.1.0";
export const MODEL_VERSION = "deterministic-baseline";

export const PREDICTION_WEIGHTS = {
  longTermStrength: 0.4,
  recentForm: 0.2,
  performance: 0.15,
  squadAvailability: 0.1,
  publicConsensus: 0.15,
} as const;

export const MAX_GOALS = 7;
export const MIN_HISTORY_MATCHES = 3;
