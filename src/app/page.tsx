import Link from "next/link";

import { AquariumExperience } from "@/components/aquarium/AquariumExperience";
import { MatchCard } from "@/components/match/MatchCard";
import { DailyMatchSelector } from "@/components/match/DailyMatchSelector";
import { StatusNotice } from "@/components/ui/StatusNotice";
import { AccuracyHistory } from "@/components/prediction/AccuracyHistory";
import { CompletedMatchComparison } from "@/components/prediction/CompletedMatchComparison";
import { demoHistory, loadPredictionHistory } from "@/lib/history/load";
import {
  demoFeaturedMatch,
  loadDailyMatches,
  loadFeaturedMatch,
} from "@/lib/public-data/load";
import { publicExperienceStateSchema } from "@/types/public";

type HomeProps = {
  searchParams: Promise<{
    animation?: string | string[];
    match?: string | string[];
    state?: string | string[];
  }>;
};

const LEGACY_STATES: Record<string, string> = {
  "not-ready": "not_ready",
  "provider-unavailable": "provider_error",
};

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const requested = Array.isArray(params.state)
    ? params.state[0]
    : params.state;
  const stateResult = publicExperienceStateSchema.safeParse(
    requested ? (LEGACY_STATES[requested] ?? requested) : undefined,
  );
  const selectedMatchId = Array.isArray(params.match)
    ? params.match[0]
    : params.match;
  const response = stateResult.success
    ? demoFeaturedMatch(stateResult.data)
    : await loadFeaturedMatch(selectedMatchId);
  const dailyMatches = stateResult.success
    ? response.match
      ? [{ match: response.match, result: response.result }]
      : []
    : await loadDailyMatches(response);
  const history =
    stateResult.success &&
    ["finished", "tournament_complete"].includes(stateResult.data)
      ? demoHistory()
      : await loadPredictionHistory();

  return (
    <main>
      <header className="site-header">
        <Link className="wordmark" href="/" aria-label="OctoOracle 2026 home">
          <span aria-hidden="true">O</span>
          <strong>OctoOracle</strong>
          <small>2026</small>
        </Link>
        <p>World Cup predictions, performed with eight times the drama.</p>
      </header>

      <div className="page-shell">
        <StatusNotice response={response} />
        <DailyMatchSelector
          items={dailyMatches}
          selectedMatchId={response.match?.id ?? null}
        />
        {response.match ? (
          <MatchCard match={response.match} state={response.state} />
        ) : null}
        {response.match &&
        response.prediction &&
        response.state !== "finished" ? (
          <AquariumExperience
            forceAssetFailure={params.animation === "error"}
            isInProgress={response.state === "in_progress"}
            isPreview={response.dataSource === "provider_preview"}
            match={response.match}
            prediction={response.prediction}
          />
        ) : response.state === "not_ready" ? (
          <section
            className="prediction-panel"
            aria-label="Prediction not ready"
          >
            <p>The octopus is still thinking. Check again later.</p>
          </section>
        ) : null}
        {response.match && response.result && response.state === "finished" ? (
          <CompletedMatchComparison
            match={response.match}
            prediction={response.prediction}
            result={response.result}
          />
        ) : null}
        <AccuracyHistory history={history} />

        <footer className="disclaimer">
          <div>
            <strong>Created by Darwin Hernandez</strong>
            <span>For entertainment purposes only.</span>
            <span>
              Predictions express uncertainty. They are not guarantees or
              wagering advice.
            </span>
          </div>
          <nav aria-label="Project and tournament links">
            <a
              href="https://darwinhernandez.com"
              target="_blank"
              rel="noreferrer"
            >
              More info: darwinhernandez.com
            </a>
            <a
              href="https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/scores-fixtures"
              target="_blank"
              rel="noreferrer"
            >
              Official FIFA calendar and scores
            </a>
          </nav>
        </footer>
      </div>
    </main>
  );
}
