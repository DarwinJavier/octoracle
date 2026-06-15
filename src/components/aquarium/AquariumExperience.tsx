"use client";

import { useEffect, useRef, useState } from "react";

import { PredictionPanel } from "@/components/prediction/PredictionPanel";
import type { AquariumGameController, AquariumState } from "@/game/types";
import type { StaticMatch, StaticPrediction } from "@/types/public";

type ExperienceStatus = "loading" | "ready" | "running" | "complete" | "error";

export function AquariumExperience({
  forceAssetFailure = false,
  isInProgress = false,
  isPreview = false,
  match,
  prediction,
}: {
  forceAssetFailure?: boolean;
  isInProgress?: boolean;
  isPreview?: boolean;
  match: StaticMatch;
  prediction: StaticPrediction;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<AquariumGameController | null>(null);
  const predictionRef = useRef<HTMLDivElement>(null);
  const [animationState, setAnimationState] = useState<AquariumState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [revealed, setRevealed] = useState(isInProgress);
  const [status, setStatus] = useState<ExperienceStatus>("loading");

  useEffect(() => {
    let active = true;

    if (forceAssetFailure) {
      const update = window.setTimeout(() => {
        setErrorMessage("Animation asset failed to load.");
        setStatus("error");
      }, 0);
      return () => window.clearTimeout(update);
    }

    const setup = async () => {
      if (!containerRef.current) return;
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (reducedMotion) {
        setReducedMotion(true);
        setStatus("ready");
        return;
      }
      const { createAquariumGame } = await import("@/game/createAquariumGame");
      if (!active || !containerRef.current) return;

      controllerRef.current = createAquariumGame({
        animationSeed: prediction.animationSeed,
        container: containerRef.current,
        onComplete: () => {
          setAnimationState("complete");
          setRevealed(true);
          setStatus("complete");
          if (isInProgress) return;
          window.setTimeout(() => {
            predictionRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }, 250);
        },
        onError: (message) => {
          setErrorMessage(message);
          setStatus("error");
        },
        onReady: () => {
          if (isInProgress) {
            setStatus("complete");
            window.setTimeout(() => controllerRef.current?.skip(), 0);
            return;
          }
          setStatus("ready");
        },
        onStateChange: setAnimationState,
        outcome: prediction.selectedOutcome,
        predictedScoreA90: prediction.predictedScoreA90,
        predictedScoreB90: prediction.predictedScoreB90,
        reducedMotion,
        teamACode: match.teamA.fifaCode,
        teamAFlagAssetUrl: match.teamA.flagAssetUrl
          ? `/api/teams/${encodeURIComponent(match.teamA.id)}/flag`
          : null,
        teamAName: match.teamA.shortName,
        teamBCode: match.teamB.fifaCode,
        teamBFlagAssetUrl: match.teamB.flagAssetUrl
          ? `/api/teams/${encodeURIComponent(match.teamB.id)}/flag`
          : null,
        teamBName: match.teamB.shortName,
      });
    };

    void setup().catch(() => {
      if (active) {
        setErrorMessage("Animation could not start.");
        setStatus("error");
      }
    });

    return () => {
      active = false;
      controllerRef.current?.destroy();
      controllerRef.current = null;
    };
  }, [forceAssetFailure, isInProgress, match, prediction]);

  const start = () => {
    setRevealed(false);
    if (reducedMotion) {
      setAnimationState("complete");
      setRevealed(true);
      setStatus("complete");
      window.setTimeout(() => {
        predictionRef.current?.scrollIntoView({ block: "start" });
      }, 0);
      return;
    }
    if (status === "error") {
      setAnimationState("complete");
      setRevealed(true);
      window.setTimeout(() => {
        predictionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 0);
      return;
    }
    setStatus("running");
    controllerRef.current?.start();
  };

  const skip = () => {
    controllerRef.current?.skip();
  };

  const replay = () => {
    if (reducedMotion) {
      setRevealed(true);
      return;
    }
    setRevealed(false);
    setStatus("running");
    controllerRef.current?.start();
  };

  return (
    <>
      <section className="aquarium-section" aria-labelledby="aquarium-heading">
        <div className="section-heading">
          <div>
            <p>The prediction ritual</p>
            <h2 id="aquarium-heading">
              {isInProgress
                ? "The octopus has already spoken"
                : "The tank is ready"}
            </h2>
          </div>
          <span
            className="sr-only"
            data-testid="animation-state"
            aria-live="polite"
          >
            {animationState.replaceAll("_", " ")}
          </span>
        </div>

        <div
          className="aquarium-frame phaser-frame"
          ref={containerRef}
          data-testid="phaser-container"
          aria-label="Animated aquarium prediction scene"
          role="img"
        >
          {status === "loading" ? (
            <p className="canvas-message">Preparing the aquarium…</p>
          ) : null}
          {status === "error" ? (
            <div className="canvas-error" role="status">
              <strong>The animation could not load.</strong>
              <span>{errorMessage} The prediction is still available.</span>
            </div>
          ) : null}
          {reducedMotion ? (
            <p className="canvas-message">
              Reduced motion is enabled. The prediction is available without
              animation.
            </p>
          ) : null}
        </div>

        <div className="ritual-actions ritual-actions-compact">
          <div className="ritual-buttons">
            {!isInProgress &&
            (status === "ready" || (status === "error" && !revealed)) ? (
              <button type="button" className="primary-button" onClick={start}>
                Ask the Octopus
              </button>
            ) : null}
            {!isInProgress && status === "running" ? (
              <button type="button" className="secondary-button" onClick={skip}>
                Skip animation
              </button>
            ) : null}
            {!isInProgress && status === "complete" ? (
              <button
                type="button"
                className="secondary-button"
                onClick={replay}
              >
                Replay animation
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <div ref={predictionRef}>
        <PredictionPanel
          isInProgress={isInProgress}
          match={match}
          isPreview={isPreview}
          prediction={prediction}
          revealed={revealed}
        />
      </div>
    </>
  );
}
