export function ClosedMatchNotice() {
  return (
    <section
      className="prediction-panel closed-match-panel"
      aria-labelledby="closed-match-heading"
    >
      <p>Match in progress</p>
      <h2 id="closed-match-heading">OctoOracle is closed for this match</h2>
      <span>
        No pre-match prediction was recorded, so we will not invent one after
        kickoff.
      </span>
      <a className="secondary-button" href="#games-today">
        Reveal a prediction for the next match
      </a>
    </section>
  );
}
