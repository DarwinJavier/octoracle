import { describe, expect, it } from "vitest";

import { buildAnimationSequence } from "@/game/animation/stateMachine";

describe("deterministic aquarium state machine", () => {
  it("replays the same seeded sequence exactly", () => {
    const first = buildAnimationSequence("team_a", "stored-seed-v1");
    const replay = buildAnimationSequence("team_a", "stored-seed-v1");

    expect(replay).toEqual(first);
  });

  it.each([
    ["team_a", "octopus-swim-left"],
    ["draw", "octopus-draw-shrug"],
    ["team_b", "octopus-swim-right"],
  ] as const)("maps %s to its required choice texture", (outcome, texture) => {
    const sequence = buildAnimationSequence(outcome, "outcome-test");
    expect(sequence.find((step) => step.state === "choose")?.texture).toBe(
      texture,
    );
  });

  it("includes draw inspection only when draw is selected", () => {
    expect(
      buildAnimationSequence("draw", "draw-test").map(({ state }) => state),
    ).toContain("inspect_draw");
    expect(
      buildAnimationSequence("team_a", "team-test").map(({ state }) => state),
    ).not.toContain("inspect_draw");
  });

  it("does not introduce a shell reveal into the team-box sequence", () => {
    const sequence = buildAnimationSequence("team_a", "team-box-test");

    expect(sequence.map(({ texture }) => texture)).not.toContain(
      "octopus-open-reveal",
    );
    expect(
      sequence.find((step) => step.state === "open_container")?.texture,
    ).toBe("octopus-select-left");
  });

  it("always completes with reveal before complete", () => {
    const states = buildAnimationSequence("team_b", "complete-test").map(
      ({ state }) => state,
    );
    expect(states.slice(-2)).toEqual(["reveal", "complete"]);
  });

  it("preserves the required state order", () => {
    expect(
      buildAnimationSequence("draw", "ordered-test").map(({ state }) => state),
    ).toEqual([
      "idle",
      "intro",
      "inspect_team_a",
      "inspect_team_b",
      "inspect_draw",
      "hesitate",
      "choose",
      "open_container",
      "eat",
      "celebrate",
      "reveal",
      "complete",
    ]);
  });

  it("paces the ritual slowly enough to follow the choice", () => {
    const totalDuration = buildAnimationSequence(
      "team_a",
      "pacing-test",
    ).reduce((total, step) => total + step.duration, 0);

    expect(totalDuration).toBeGreaterThanOrEqual(6_000);
  });
});
