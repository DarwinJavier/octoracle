import { calculatePredictionAccuracy } from "@/lib/results/service";
import type {
  PublicMatch,
  PublicPrediction,
  PublicResult,
} from "@/types/public";

export function CompletedMatchComparison({
  match,
  prediction,
  result,
}: {
  match: PublicMatch;
  prediction: PublicPrediction | null;
  result: PublicResult;
}) {
  const accuracy = prediction
    ? calculatePredictionAccuracy(
        prediction,
        {
          matchProviderId: match.id,
          providerUpdatedAt: match.kickoffAtUtc,
          scoreA90: result.scoreA90,
          scoreB90: result.scoreB90,
          scoreAFinal: result.scoreAFinal,
          scoreBFinal: result.scoreBFinal,
          status:
            result.scoreAFinal === result.scoreA90 &&
            result.scoreBFinal === result.scoreB90
              ? "finished"
              : "finished_after_penalties",
          winnerProviderTeamId: result.winnerTeamId,
        },
        match.teamA.id,
        match.teamB.id,
      )
    : null;

  return (
    <section
      className="prediction-panel completed-comparison"
      aria-labelledby="comparison-heading"
    >
      <div className="section-heading">
        <div>
          <p>Prediction vs result</p>
          <h2 id="comparison-heading">How did the octopus do?</h2>
        </div>
      </div>
      <div className="comparison-grid">
        <article className="prediction-result">
          <p>Real result</p>
          <h3>
            {match.teamA.shortName} {result.scoreAFinal}–{result.scoreBFinal}{" "}
            {match.teamB.shortName}
          </h3>
          <strong>
            {result.scoreAFinal === result.scoreA90 &&
            result.scoreBFinal === result.scoreB90
              ? "Final result"
              : `Final result; 90-minute score was ${result.scoreA90}–${result.scoreB90}`}
          </strong>
        </article>
        <article className="prediction-result">
          <p>Recorded prediction</p>
          {prediction ? (
            <>
              <h3>
                {match.teamA.shortName} {prediction.predictedScoreA90}–
                {prediction.predictedScoreB90} {match.teamB.shortName}
              </h3>
              <strong>
                {accuracy?.exactScoreCorrect
                  ? "Exact score correct"
                  : accuracy?.outcomeCorrect
                    ? "Outcome correct"
                    : "Prediction missed"}
              </strong>
            </>
          ) : (
            <>
              <h3>Not recorded</h3>
              <strong>No revealed pre-match prediction is available.</strong>
            </>
          )}
        </article>
      </div>
    </section>
  );
}
