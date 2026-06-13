import { Countdown } from "@/components/match/Countdown";
import { TeamBadge } from "@/components/match/TeamBadge";
import { formatEasternPacificKickoff } from "@/lib/time";
import type { PublicExperienceState, StaticMatch } from "@/types/public";

export function MatchCard({
  match,
  state = "upcoming",
}: {
  match: StaticMatch;
  state?: PublicExperienceState;
}) {
  const hasLocation =
    !match.venue.toLowerCase().includes("to be confirmed") &&
    !match.city.toLowerCase().includes("to be confirmed");

  return (
    <section className="match-card" aria-labelledby="next-match-heading">
      <div className="section-kicker">
        <span>{match.stage}</span>
        {match.groupCode ? <span>Group {match.groupCode}</span> : null}
        {match.matchNumber ? <span>Match {match.matchNumber}</span> : null}
      </div>
      <h1 id="next-match-heading">
        {state === "in_progress"
          ? "Featured match"
          : state === "finished"
            ? "Completed match"
            : "Next match"}
      </h1>

      <div className="matchup">
        <TeamBadge side="A" team={match.teamA} />
        <div className="versus" aria-label="versus">
          VS
        </div>
        <TeamBadge side="B" team={match.teamB} />
      </div>

      <div className="match-details">
        <div>
          <span>Kickoff</span>
          <time dateTime={match.kickoffAtUtc}>
            {formatEasternPacificKickoff(match.kickoffAtUtc)}
          </time>
        </div>
        {hasLocation ? (
          <div>
            <span>Location</span>
            <strong>
              {match.venue}, {match.city}
            </strong>
          </div>
        ) : null}
      </div>

      <Countdown kickoffAtUtc={match.kickoffAtUtc} />
    </section>
  );
}
