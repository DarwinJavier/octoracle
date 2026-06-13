# OctoOracle 2026

OctoOracle 2026 is a mobile-first World Cup entertainment and sports-analysis experience. A deterministic, source-backed prediction controls a playful octopus animation for the featured match.

The project has completed **Step 8: Results, History, and Accuracy**. Launch readiness begins in Step 9.

## Authoritative Documents

- [AGENTS.md](AGENTS.md): engineering, security, data, and product rules
- [PROJECT_BRIEF.md](PROJECT_BRIEF.md): product and UX direction
- [ASSET_MANIFEST.md](ASSET_MANIFEST.md): production asset names and usage
- [PLAN.md](PLAN.md): staged delivery checklist and implementation reports

Supporting technical documents live in [`docs/`](docs/).

## Locked MVP Decisions

- Predictions freeze exactly at kickoff using server UTC.
- No prediction is generated or refreshed after kickoff.
- An active featured match remains visible until its final status is known.
- Group-stage draw predictions use the octopus's neutral shrug without a central physical choice.
- `aquarium-glass-overlay.png` remains a production asset requirement but is omitted from the prototype until repaired or replaced through review.
- football-data.org v4 is the initial fixture provider behind a provider-neutral adapter.
- Odds, wagering data, and provider prediction products are never requested or stored.

## Assets

The source masters are in [`sprites/`](sprites/). Do not rename, replace, add, remove, or change production asset usage without updating [ASSET_MANIFEST.md](ASSET_MANIFEST.md) in the same change.

## Development

Requirements:

- Node.js 24
- npm 11

Install dependencies, generate runtime assets, and start the development server:

```text
npm install
npm run assets:build
npm run dev
```

Run the complete local acceptance suite:

```text
npm run check
```

Individual checks are available through `format:check`, `lint`, `typecheck`, `test`, `test:integration`, `test:e2e`, `test:assets`, and `build`.

## Vercel Deployment

Vercel auto-detects this repository as Next.js. No custom build command or output directory is required. The repository pins Node.js 24 and generates the ignored runtime assets during `npm run build`.

Minimum environment variable for the current provider-preview MVP:

```text
FOOTBALL_DATA_API_KEY
```

Add these server-side variables after Supabase migrations are applied:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
INTERNAL_CRON_SECRET
```

Add these only when secure public-source research is enabled:

```text
OPENAI_API_KEY
OPENAI_RESEARCH_MODEL
ALLOWED_RESEARCH_DOMAINS
RESEARCH_SOURCE_URLS
```

Never configure service-role, provider, model, or cron secrets with a `NEXT_PUBLIC_` prefix. Configure `APP_BASE_URL` to the final production URL after the first deployment.

Deploy from the connected GitHub repository in Vercel, or use:

```text
npx vercel
npx vercel --prod
```

## Fixture Synchronization

- Apply every SQL file in [`supabase/migrations/`](supabase/migrations/) in filename order. The service-role privilege migration is required when applying migrations through the Supabase SQL Editor.
- Configure `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `FOOTBALL_DATA_API_KEY`, and `INTERNAL_CRON_SECRET` on the server.
- Call `POST /api/internal/sync-fixtures` with an exact bearer secret and an `Idempotency-Key` header.
- The football-data.org adapter calls only the fixed `WC` competition-matches endpoint, authenticates with `X-Auth-Token`, validates normalized fields, and never requests odds.
- The read-only team-flag endpoint proxies only validated football-data.org crest URLs and rasterizes them with `sharp` so Phaser can render the same flags used by the semantic match card.
- The public page reads the deterministic featured match and stored prediction through the server-side public-data service.

## Prediction Engine

- Version-controlled baseline weights live in `src/lib/prediction/config.ts`.
- Strict validated inputs produce normalized outcome probabilities, expected goals, a compatible Poisson scoreline, confidence, reason codes, snapshot hash, and deterministic animation seed.
- `POST /api/internal/build-prediction` builds a prediction for one stored internal match UUID using completed team histories from football-data.org, validated stored consensus, and neutral values for unavailable squad or consensus evidence.
- Historical signals and the exact contributing provider match IDs are stored in `prediction_signal_snapshots` before publication.
- Apply `supabase/migrations/20260609150000_prediction_immutability.sql` after the initial schema migration.
- Apply `supabase/migrations/20260611130000_prediction_signal_snapshots.sql` before running live prediction builds.
- Prediction publication, version supersession, kickoff freezing, and reschedule voiding use service-role-only transactional database functions.
- The prediction engine remains server-side; the browser receives only validated public fields.

## Public Read APIs

```text
GET /api/health
GET /api/matches/next
GET /api/matches/:matchId
GET /api/matches/:matchId/prediction
```

- Public routes expose no write methods and validate every response.
- Supabase service-role credentials remain server-side behind the repository boundary.
- Responses explicitly distinguish `upcoming`, `in_progress`, `finished`, `not_ready`, `stale`, `tournament_complete`, and `provider_error`.
- When stored Supabase fixtures are unavailable but `FOOTBALL_DATA_API_KEY` is configured, the homepage shows a clearly labeled live-provider preview. It builds a deterministic, non-persisted prediction from available validated team history and never generates one after kickoff.
- The homepage lists every fixture on the selected match's Eastern-time calendar day. Selecting a fixture with `?match=<provider-id>` updates the match card, aquarium, and deterministic preview.
- The “Previous results” link jumps to the frozen-prediction accuracy record. Comparisons appear only when a real frozen prediction and completed result both exist.
- MVP provider-preview predictions that were actually revealed are preserved in an immutable version-controlled preview ledger until the Supabase prediction lifecycle is available. Canada vs Bosnia-Herzegovina and USA vs Paraguay are the first recorded previews; finished ledger entries are merged into accuracy history without replacing stored production records.
- Without either stored fixtures or a configured football-data.org key, local development uses a clearly labeled illustrative fixture rather than pretending it is live data.

## Secure Research

- `POST /api/internal/research-match` is protected by the internal bearer secret, idempotency key, rate limit, database lock, and completed-run check.
- Callers provide only the match ID and team names. Research URLs come from server-controlled `RESEARCH_SOURCE_URLS`.
- Deployment-selected domains must also belong to the reviewed hardcoded federation allowlist.
- The fetcher enforces HTTPS, redirect checks, response limits, expected content types, and plain-text sanitization.
- OpenAI Structured Outputs extracts only strict source observations and receives no tools or write capabilities.
- Validated observations are stored idempotently; consensus can update numerical model inputs but cannot directly choose or persist a prediction.

## Results And Accuracy

- `POST /api/internal/sync-results` synchronizes completed results through an authenticated, locked, idempotent job.
- Normal-time, extra-time, and penalty resolutions keep the 90-minute score separate from the final score and winner.
- Every distinct provider result or correction creates a `match_result_revisions` audit record.
- Frozen predictions are never edited when results change.
- `GET /api/predictions/history?limit=20` returns completed frozen predictions with recalculated outcome and exact-score accuracy.
- The public page presents resolved prediction history and supports tournament-complete behavior.

## Runtime Asset Pipeline

- Keep source masters unchanged in `sprites/`.
- Run `npm run assets:build` to generate optimized PNG exports under `public/assets/`.
- Run `npm run test:assets` to validate the source inventory and runtime exports.
- Runtime exports are generated files and are not committed.
- `aquarium-glass-overlay.png` is intentionally excluded until repaired or replaced through review.
