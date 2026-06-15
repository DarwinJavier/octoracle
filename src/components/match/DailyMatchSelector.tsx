import Link from "next/link";

import { formatEasternPacificKickoff } from "@/lib/time";
import type { PublicMatch, PublicResult } from "@/types/public";

export type DailyMatchItem = {
  match: PublicMatch;
  result: PublicResult | null;
};

export function DailyMatchSelector({
  items,
  selectedMatchId,
}: {
  items: DailyMatchItem[];
  selectedMatchId: string | null;
}) {
  return (
    <nav id="games-today" className="daily-matches" aria-label="Games today">
      <div className="section-heading">
        <div>
          <p>Choose a prediction</p>
          <h2>Games today</h2>
        </div>
        <Link href="#accuracy-history">Previous results</Link>
      </div>
      <div className="daily-match-list">
        {items.map(({ match, result }) => (
          <Link
            aria-current={match.id === selectedMatchId ? "page" : undefined}
            className="daily-match-link"
            href={`/?match=${encodeURIComponent(match.id)}`}
            key={match.id}
            prefetch={false}
          >
            <strong>
              {match.teamA.shortName} vs {match.teamB.shortName}
            </strong>
            <span>{formatEasternPacificKickoff(match.kickoffAtUtc)}</span>
            {result ? (
              <span className="daily-match-result">
                Final: {match.teamA.shortName} {result.scoreA90}–
                {result.scoreB90} {match.teamB.shortName}
              </span>
            ) : null}
          </Link>
        ))}
      </div>
    </nav>
  );
}
