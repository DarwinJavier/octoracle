import type { PredictionHistoryResponse } from "@/types/public";

function percent(value: number | null) {
  return value === null ? "Not available" : `${Math.round(value * 100)}%`;
}

export function AccuracyHistory({
  history,
}: {
  history: PredictionHistoryResponse;
}) {
  return (
    <section
      id="accuracy-history"
      className={`prediction-panel accuracy-history${history.total === 0 ? " accuracy-history-empty" : ""}`}
      aria-labelledby="accuracy-heading"
    >
      <div className="section-heading">
        <div>
          <p>Frozen prediction record</p>
          <h2 id="accuracy-heading">Accuracy history</h2>
        </div>
        <span className="prototype-badge">{history.total} resolved</span>
      </div>
      {history.total === 0 ? (
        <p>No completed frozen predictions are available yet.</p>
      ) : (
        <>
          <dl className="prediction-meta">
            <div>
              <dt>Outcome accuracy</dt>
              <dd>{percent(history.outcomeAccuracy)}</dd>
            </div>
            <div>
              <dt>Exact-score accuracy</dt>
              <dd>{percent(history.exactScoreAccuracy)}</dd>
            </div>
          </dl>
          <div className="history-list">
            {history.items.map((item) => (
              <article
                key={`${item.match.id}-${item.prediction.version}`}
                className="prediction-explanation"
              >
                <h3>
                  {item.match.teamA.shortName} {item.result.scoreA90}–
                  {item.result.scoreB90} {item.match.teamB.shortName}
                </h3>
                <p>
                  Predicted {item.prediction.predictedScoreA90}–
                  {item.prediction.predictedScoreB90}. Outcome{" "}
                  {item.accuracy.outcomeCorrect ? "correct" : "incorrect"};
                  exact score{" "}
                  {item.accuracy.exactScoreCorrect ? "correct" : "incorrect"}.
                  {item.result.scoreAFinal !== item.result.scoreA90 ||
                  item.result.scoreBFinal !== item.result.scoreB90
                    ? ` Final resolution ${item.result.scoreAFinal}–${item.result.scoreBFinal}.`
                    : ""}
                </p>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
