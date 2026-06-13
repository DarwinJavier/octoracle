import { createSeededRandom } from "@/game/animation/seededRandom";
import type { AnimationOutcome, AnimationStep } from "@/game/types";

export function buildAnimationSequence(
  outcome: AnimationOutcome,
  animationSeed: string,
): AnimationStep[] {
  const random = createSeededRandom(animationSeed);
  const idleTexture =
    random() > 0.5 ? "octopus-idle-alt" : "octopus-idle-front";
  const hesitateTexture =
    random() > 0.66
      ? "octopus-reconsider-turn"
      : random() > 0.5
        ? "octopus-thinking"
        : "octopus-hesitate-center";
  const chooseTexture =
    outcome === "team_a"
      ? "octopus-swim-left"
      : outcome === "team_b"
        ? "octopus-swim-right"
        : "octopus-draw-shrug";
  const eatTexture =
    outcome === "team_a"
      ? "octopus-select-left"
      : outcome === "team_b"
        ? "octopus-select-right"
        : "octopus-draw-shrug";

  return [
    { duration: 0, state: "idle", texture: idleTexture },
    { duration: 700, state: "intro", texture: "octopus-idle-front" },
    {
      duration: 800,
      state: "inspect_team_a",
      texture: "octopus-inspect-left",
    },
    {
      duration: 800,
      state: "inspect_team_b",
      texture: "octopus-inspect-right",
    },
    ...(outcome === "draw"
      ? [
          {
            duration: 700,
            state: "inspect_draw" as const,
            texture: "octopus-draw-shrug",
          },
        ]
      : []),
    { duration: 950, state: "hesitate", texture: hesitateTexture },
    { duration: 1_050, state: "choose", texture: chooseTexture },
    {
      duration: 650,
      state: "open_container",
      texture: eatTexture,
    },
    { duration: 550, state: "eat", texture: eatTexture },
    {
      duration: 850,
      state: "celebrate",
      texture: "octopus-celebrate",
    },
    {
      duration: 650,
      state: "reveal",
      texture: "octopus-celebrate",
    },
    { duration: 0, state: "complete", texture: "octopus-celebrate" },
  ];
}
