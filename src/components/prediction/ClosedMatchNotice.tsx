import Image from "next/image";

export function ClosedMatchNotice() {
  return (
    <section
      className="prediction-panel closed-match-panel"
      aria-labelledby="closed-match-heading"
    >
      <Image
        alt="OctoOracle sleeping in the aquarium while this match is in progress"
        className="closed-match-illustration"
        height="900"
        priority
        src="/assets/illustrations/octopus-sleeping-scene.png"
        width="1600"
      />
      <div className="closed-match-copy">
        <p>Match in progress</p>
        <h2 id="closed-match-heading">OctoOracle is closed for this match</h2>
        <span>
          No pre-match prediction was recorded, so we will not invent one after
          kickoff.
        </span>
        <a className="secondary-button" href="#games-today">
          Reveal a prediction for the next match
        </a>
      </div>
    </section>
  );
}
