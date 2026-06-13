# Data Sources

## Fixtures and Results

football-data.org API v4 is the initial provider behind a provider-neutral adapter. The configured free subscription includes the FIFA World Cup competition code `WC`.

- Use the fixed `GET /v4/competitions/WC/matches` endpoint for schedules, match status, and results.
- Use the fixed, validated `GET /v4/teams/:teamId/matches` endpoint with `FINISHED` status and a bounded two-year date window for historical prediction inputs.
- Authenticate server-side with the `X-Auth-Token` header.
- Normalize only required competition, fixture, participant, venue, state, and score fields.
- Respect the free-plan rate limit of 10 requests per minute and avoid unnecessary polling.
- Never request or store odds or wagering data.
- Use FIFA's public schedule only for human verification.

The adapter requests the fixed June 11 through July 20, 2026 tournament range, validates the response shape with Zod, and maps provider states into the internal status enum. football-data.org may provide delayed rather than real-time updates, so stale-data warnings remain authoritative. Offline provider-shaped fixtures cover acceptance testing without a real API key.

For the MVP development experience, the server may use football-data.org as a clearly labeled provider preview when stored Supabase fixtures cannot be read. The preview remains read-only, uses validated provider fields and available completed-match history, is not presented as stored or frozen, and is never generated after kickoff.

The provider preview may list all validated fixtures sharing the selected match's `America/New_York` calendar day. A user can select one of those known provider fixture IDs; arbitrary URLs and arbitrary provider requests remain unsupported.

football-data.org currently omits the venue and city for some World Cup fixtures. A small provider-ID keyed fallback may fill those fields only after human verification against the published tournament schedule. Canada vs Bosnia-Herzegovina (`537333`) is verified as Toronto Stadium, Toronto. Provider-supplied locations always take precedence.

The free subscription may return sparse team history for some national teams. Missing history is represented by neutral `0.5` signals and is never fabricated. Every prediction signal snapshot records the exact provider match IDs that contributed.

Completed fixtures preserve separate score concepts:

- `score_a_90` and `score_b_90`: result after regulation
- `score_a_final` and `score_b_final`: provider-confirmed final resolution
- `winner_team_id`: winning or advancing team when applicable

Validated result corrections leave immutable revision records.

## Prediction Research

Research sources must be allowlisted, reputable, publicly accessible for the intended use, and processed as untrusted input. Every accepted observation must retain its source domain, canonical URL, timestamps, content hash, match ID, structured lean, confidence, evidence categories, summary, parser version, and model version.

The initial reviewed hardcoded allowlist contains official tournament and confederation domains only:

```text
fifa.com
concacaf.com
uefa.com
cafonline.com
the-afc.com
conmebol.com
oceaniafootball.com
```

Deployment configuration may select a subset through `ALLOWED_RESEARCH_DOMAINS`; it cannot expand the hardcoded list without code review. Exact source URLs are server-controlled through `RESEARCH_SOURCE_URLS` and are never accepted from public or internal request bodies.

Retrieved content is reduced to bounded plain text before extraction. Validated observations are deduplicated by content hash, capped per domain, freshness-weighted, and stored with their audit metadata. At least three independent meaningful domains are required before consensus can influence prediction inputs.

## Step 2 Static Fixture

The static prototype uses the confirmed opening Group A fixture, Mexico vs South Africa at Mexico City Stadium on June 11, 2026. The fixture and kickoff were human-verified against [FIFA's published schedule](https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/match-schedule-fixtures-results-teams-stadiums) before implementation.

The Step 2 prediction is explicitly illustrative and has a source count of zero. It must not be treated as a real source-backed forecast. Approved public-source consensus begins in Step 7.
