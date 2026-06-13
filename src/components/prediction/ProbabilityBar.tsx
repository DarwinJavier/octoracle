export function ProbabilityBar({
  label,
  probability,
}: {
  label: string;
  probability: number;
}) {
  const percentage = Math.round(probability * 100);

  return (
    <div className="probability">
      <div>
        <span>{label}</span>
        <strong>{percentage}%</strong>
      </div>
      <div
        className="probability-track"
        role="meter"
        aria-label={`${label} probability`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentage}
      >
        <span style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
