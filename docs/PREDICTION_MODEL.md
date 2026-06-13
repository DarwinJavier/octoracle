# Prediction Model

## Governing Rules

- Versioned application code, not an LLM or the animation, produces the final probabilities and selected outcome.
- Identical validated inputs and algorithm version must produce identical results.
- Probabilities must be normalized and the predicted 90-minute score must be consistent with the selected outcome.
- Group-stage matches may select a draw.
- Knockout matches store the predicted 90-minute score separately from the team predicted to advance.
- Predictions freeze exactly at kickoff using server UTC.
- No prediction is generated or refreshed after kickoff.
- Frozen predictions are immutable; corrections create auditable versions or void incompatible predictions.

## Baseline Version 1.1.0

The deterministic development baseline accepts symmetric, validated values from `0` to `1` for both teams. It uses these version-controlled weights:

```text
40% long-term strength
20% recent form
15% attacking and defensive performance
10% squad availability
15% validated public-source consensus
```

The engine calculates a weighted advantage, converts team A, draw, and team B logits through softmax, and normalizes the result to exactly one within floating-point tolerance. Draw affinity rises only when the teams' weighted ratings are genuinely close; a meaningful validated rating gap must favor a team outcome.

Expected goals are derived from validated attacking performance and the weighted advantage. An independent Poisson score search selects the most likely 90-minute score that is compatible with the selected outcome. Knockout matches store the 90-minute outcome separately from the team predicted to advance.

The baseline is intentionally transparent and requires calibration against historical international-match data before launch. Changing weights or calculation behavior requires a new `algorithm_version`.

## Audit And Lifecycle

- The input snapshot, weights, and algorithm version produce a SHA-256 `input_snapshot_hash`.
- Live historical inputs use up to 20 completed matches from a bounded two-year provider window. Recent form, attack, and defense use the most recent eight available matches.
- At least three completed provider matches per team are required for a live provider-preview prediction. When either team lacks that minimum, the prediction remains not ready rather than converting missing evidence into a draw.
- Missing squad evidence or sufficient consensus produces an explicit neutral `0.5` signal.
- `prediction_signal_snapshots` stores both teams' normalized signals and exact contributing provider match IDs before prediction publication.
- The match ID and snapshot produce a deterministic `animation_seed`.
- Reason codes and the public explanation are generated only from validated numerical inputs.
- Publishing a version and superseding the prior published version occur in one database transaction.
- Database triggers reject analytical edits to existing versions.
- A transactional database function freezes every due published prediction exactly at kickoff.
- Postponed or corrected fixtures explicitly void incompatible frozen predictions.

## Public-Source Consensus

- The research model produces observations only; it never selects the final prediction.
- Duplicate content and excessive observations from one domain are removed before scoring.
- Confidence is multiplied by a bounded freshness weight.
- Draw observations contribute neutrally to both teams.
- Fewer than three independent meaningful domains produces a neutral `0.5` consensus signal for both teams.
- Sufficient validated consensus updates only the `publicConsensus` numerical inputs and source count before the deterministic baseline runs.

## Accuracy

- Accuracy compares the exact frozen prediction version against the latest validated completed result.
- Outcome and exact-score accuracy use the 90-minute result.
- Knockout advancement accuracy is calculated separately.
- Corrected results recalculate accuracy without editing prediction history.
