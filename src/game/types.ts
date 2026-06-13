import type { StaticPrediction } from "@/types/public";

export type AnimationOutcome = StaticPrediction["selectedOutcome"];

export type AquariumState =
  | "idle"
  | "intro"
  | "inspect_team_a"
  | "inspect_team_b"
  | "inspect_draw"
  | "hesitate"
  | "choose"
  | "open_container"
  | "eat"
  | "celebrate"
  | "reveal"
  | "complete";

export type AnimationStep = {
  duration: number;
  state: AquariumState;
  texture: string;
};

export type AquariumGameOptions = {
  animationSeed: string;
  container: HTMLElement;
  onComplete: () => void;
  onError: (message: string) => void;
  onReady: () => void;
  onStateChange: (state: AquariumState) => void;
  outcome: AnimationOutcome;
  predictedScoreA90: number;
  predictedScoreB90: number;
  reducedMotion: boolean;
  teamACode: string;
  teamAFlagAssetUrl: string | null;
  teamAName: string;
  teamBCode: string;
  teamBFlagAssetUrl: string | null;
  teamBName: string;
};

export type AquariumGameController = {
  destroy: () => void;
  skip: () => void;
  start: () => void;
};
