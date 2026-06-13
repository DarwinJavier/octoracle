import Image from "next/image";

import type { Team } from "@/types/public";

export function TeamBadge({ side, team }: { side: "A" | "B"; team: Team }) {
  return (
    <article className={`team-badge team-${side.toLowerCase()}`}>
      {team.flagAssetUrl ? (
        <Image
          alt={`${team.name} flag`}
          className="flag flag-image"
          height={48}
          src={team.flagAssetUrl}
          width={72}
        />
      ) : (
        <span className="flag" role="img" aria-label={`${team.name} flag`}>
          {team.flagEmoji || team.fifaCode}
        </span>
      )}
      <span className="team-code">{team.fifaCode}</span>
      <h3>{team.shortName}</h3>
      <span className="team-side">Team {side}</span>
    </article>
  );
}
