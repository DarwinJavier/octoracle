"use client";

import { ProbabilityBar } from "@/components/prediction/ProbabilityBar";
import { formatUtcDateTime } from "@/lib/time";
import type { StaticMatch, StaticPrediction } from "@/types/public";

export function PredictionPanel({
  isInProgress = false,
  isPreview = false,
  match,
  prediction,
  revealed,
}: {
  isInProgress?: boolean;
  isPreview?: boolean;
  match: StaticMatch;
  prediction: StaticPrediction;
  revealed: boolean;
}) {
  if (!revealed) return null;

  const selectedOutcome =
    prediction.selectedOutcome === "team_a"
      ? `${match.teamA.name} wins!`
      : prediction.selectedOutcome === "team_b"
        ? `${match.teamB.name} wins!`
        : "Draw";

  return (
    <section className="prediction-panel" aria-labelledby="prediction-heading">
      <div className="prediction-intro">
        <div>
          <p>
            {isInProgress
              ? `Frozen prediction - Version ${prediction.version}`
              : isPreview
                ? "Live provider preview"
                : `${prediction.status === "frozen" ? "Frozen" : "Stored"} prediction - Version ${prediction.version}`}
          </p>
          <h2 id="prediction-heading">
            {isInProgress
              ? "The Octopus already spoke"
              : "The Octopus has spoken"}
          </h2>
          <span>
            {isPreview
              ? "A deterministic statistical preview, performed with eight times the drama."
              : "A source-backed prediction, performed with eight times the drama."}
          </span>
        </div>
        <span className="reveal-complete">
          {isInProgress ? "Frozen at kickoff" : "Prediction revealed"}
        </span>
      </div>

      <div className="prediction-reveal" aria-live="polite">
        <div className="prediction-result">
          <span className={`confidence confidence-${prediction.confidence}`}>
            {prediction.confidence} confidence
          </span>
          <p>Predicted result</p>
          <h3>{selectedOutcome}</h3>
          <strong>
            {match.teamA.shortName} {prediction.predictedScoreA90}–
            {prediction.predictedScoreB90} {match.teamB.shortName}
          </strong>
        </div>

        <div className="probabilities">
          <ProbabilityBar
            label={`${match.teamA.shortName} win`}
            probability={prediction.teamAWinProbability}
          />
          <ProbabilityBar
            label="Draw"
            probability={prediction.drawProbability}
          />
          <ProbabilityBar
            label={`${match.teamB.shortName} win`}
            probability={prediction.teamBWinProbability}
          />
        </div>

        <div className="prediction-explanation">
          <h3>Why this forecast?</h3>
          <p>{prediction.publicExplanation}</p>
          <ul>
            {prediction.reasonCodes.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>

        <dl className="prediction-meta">
          <div>
            <dt>Generated</dt>
            <dd>{formatUtcDateTime(prediction.generatedAt)}</dd>
          </div>
          <div>
            <dt>
              {isPreview
                ? "Kickoff"
                : prediction.frozenAt
                  ? "Frozen"
                  : "Freezes"}
            </dt>
            <dd>
              {formatUtcDateTime(prediction.frozenAt ?? prediction.freezeAt)}
            </dd>
          </div>
          <div>
            <dt>Sources</dt>
            <dd>{prediction.sourceCount} approved public sources</dd>
          </div>
        </dl>
        <p className="method-note">
          {prediction.sourceCount > 0
            ? "Prediction generated from multiple public sources and statistical signals."
            : "Baseline statistical prediction. Approved public-source consensus arrives in Step 7."}
        </p>
      </div>
    </section>
  );
}
