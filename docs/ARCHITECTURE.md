# Architecture

## Current State

The repository has completed Step 8. It includes deterministic fixture/result synchronization, immutable prediction history, public accuracy reporting, strict read-only APIs, and a secured public-source observation pipeline.

## Approved Target

- Next.js App Router and strict TypeScript provide the public web application and protected route handlers.
- Phaser 3 runs only in a client component and performs a prediction already selected by server-side application code.
- Supabase Postgres stores fixtures, immutable prediction versions, source observations, and job runs.
- football-data.org v4 is accessed through a provider-neutral fixture adapter.
- OpenAI Structured Outputs may extract validated source observations but never directly select or persist a production prediction.

## Match Resolution

- `featuredMatch` returns an active match until its final status is known; otherwise it returns `nextScheduledMatch`.
- `nextScheduledMatch` returns the earliest eligible future scheduled match, breaking simultaneous kickoffs by official match number and then provider ID.
- All selection, freeze, and persistence calculations use server UTC.
- Suspended active matches remain featured; postponed, cancelled, abandoned, and finished matches are not next-scheduled candidates.
- Resolver results carry simultaneous-match notices, stale-data state, and tournament-complete state.

## Fixture Synchronization

- `FixtureProvider` keeps normalization independent from football-data.org.
- `FootballDataFixtureProvider` calls only the fixed World Cup competition-matches HTTPS endpoint with server-side header authentication, strict runtime validation, and no odds fields.
- `syncFixtures` upserts teams before matches, records sanitized job outcomes, and honors idempotency keys.
- `SupabaseFixtureRepository` uses the server-only service role and an atomic, expiring `job_locks` row.
- `POST /api/internal/sync-fixtures` requires bearer authentication, an idempotency key, a strict empty request body, and rate limiting.
- After fixture writes, the protected sync publishes the four earliest due predictions within 48 hours of kickoff, refreshes eligible published predictions every three hours, and freezes due predictions. Bounded batches keep jobs within provider and execution limits; later syncs continue with remaining matches. Public page requests remain read-only.
- A server-only, version-controlled daily recovery ledger preserves reviewed forecasts by Eastern match day and feeds the protected Supabase backfill when a primary prediction record is missing.
- A validated June 11, 2026 FIFA ranking snapshot enriches public team cards and explanations. Provider-specific codes are canonicalized before ranking lookup.

## Aquarium Animation

- Phaser 3 runs only after a client-side dynamic import.
- The semantic prediction result and Phaser scene share one client experience controller.
- The scene receives the selected outcome and stored animation seed before a run starts.
- A pure state-machine module produces the required ordered sequence and deterministic pose variations.
- Ask, skip, replay, reduced-motion completion, and asset-failure fallback all reveal the same stored outcome.
- The scene never calculates, changes, or persists a prediction.

## Boundaries

- Public endpoints are read-only.
- Protected jobs require authentication, validation, idempotency, and locking.
- Retrieved external content cannot access privileged tools, secrets, or arbitrary network requests.
- The browser receives only validated public match and prediction responses.
- The server-side public repository uses the Supabase service role because database RLS exposes no direct browser reads.
- Public routes implement GET only and return narrow Zod-validated response schemas.
- Provider flag URLs render only from `crests.football-data.org`; all other URLs fall back to visible FIFA codes.

## Public Experience States

- `upcoming`: featured scheduled match with a stored prediction
- `in_progress`: active featured match with its preserved frozen prediction
- `finished`: explicit finished-match response
- `not_ready`: featured match exists but no safe prediction is stored
- `stale`: stored fixture data exceeds the freshness threshold
- `tournament_complete`: no active or future eligible fixture exists
- `provider_error`: stored data could not be read or validated safely

The page never generates a prediction. At kickoff it retains the active match and stored prediction, while protected prediction publication already rejects new versions.

## Research Pipeline

- The protected research endpoint accepts match/team identifiers but never accepts source URLs.
- Source URLs are server-controlled and their domains must be in both deployment configuration and the reviewed hardcoded federation allowlist.
- The fetcher validates HTTPS and every redirect, enforces timeout/size/content-type limits, and converts permitted content to bounded plain text.
- The OpenAI Responses API receives untrusted reference text with no tools and returns a strict Structured Output observation.
- Zod rejects unknown fields before an observation can be persisted.
- Observation persistence is idempotent by match, domain, and content hash.
- Consensus deduplicates copied content, caps each domain to two observations, discounts stale material, and requires three independent meaningful sources before influencing model inputs.
- The research layer cannot call prediction publication or directly select an outcome.

## Results And Accuracy

- Completed fixtures normalize distinct 90-minute scores, final scores, and winners.
- The protected result-sync job accepts only complete finished results and writes through a transactional RPC.
- Every distinct result payload creates an immutable result-revision audit row; identical retries do not.
- Corrected results update the current match result but never mutate frozen predictions.
- Public history reads only frozen predictions joined to completed matches.
- Outcome, exact-score, and knockout-advancement accuracy are calculated from immutable predictions and the latest validated results.

## Prediction Engine

- Strict schemas accept symmetric numerical signals and internal UUIDs only.
- Version-controlled weights and application code produce normalized probabilities, expected goals, a compatible Poisson scoreline, confidence, reason codes, and a short explanation.
- Group-stage draws remain valid; knockout matches separately store the predicted 90-minute result and advancing team.
- Identical validated inputs produce the same snapshot hash, animation seed, and prediction output.
- Database RPCs publish versions, supersede the prior published version, freeze due predictions, and void incompatible frozen predictions transactionally.
- A database trigger prevents analytical fields from being edited after insertion.
