import type { FeaturedMatchResponse } from "@/types/public";

const notices = {
  stale: {
    title: "Fixture update delayed",
    message:
      "The schedule may be stale. We are showing the latest validated stored fixture while the provider catches up.",
  },
  not_ready: {
    title: "The octopus is still thinking",
    message: "A safe prediction is not ready yet. Check again later.",
  },
  provider_error: {
    title: "Fixture provider unavailable",
    message:
      "Stored fixture data could not be read safely. No match or prediction has been fabricated.",
  },
  in_progress: {
    title: "Match in progress",
    message:
      "The prediction is frozen. No new prediction can be generated after kickoff.",
  },
  finished: {
    title: "Match finished",
    message:
      "This match has finished. The exact frozen prediction remains preserved.",
  },
  tournament_complete: {
    title: "Tournament complete",
    message: "There are no remaining World Cup matches to feature.",
  },
} as const;

export function StatusNotice({
  response,
}: {
  response: FeaturedMatchResponse;
}) {
  if (response.dataSource === "provider_preview") {
    return (
      <aside className="status-notice" role="status">
        <strong>
          {response.state === "finished"
            ? "Recorded prediction comparison"
            : response.state === "in_progress"
              ? "Match in progress"
              : "Live provider preview"}
        </strong>
        <span>
          {response.state === "finished"
            ? "Showing the real provider result beside the prediction recorded before kickoff."
            : response.state === "in_progress"
              ? "The octopus has already spoken. Its frozen pre-match prediction remains visible, and no new prediction can be generated."
              : response.warning}
        </span>
      </aside>
    );
  }
  if (response.dataSource === "demo" && response.state === "upcoming") {
    return (
      <aside className="status-notice" role="status">
        <strong>Illustrative development fixture</strong>
        <span>
          Live stored fixture data is not configured. This preview is clearly
          marked and replaceable.
        </span>
      </aside>
    );
  }
  if (response.state === "upcoming") return null;
  const notice = notices[response.state];
  return (
    <aside className="status-notice" role="status">
      <strong>{notice.title}</strong>
      <span>{response.warning ?? notice.message}</span>
    </aside>
  );
}
