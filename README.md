# OctoOracle 2026

A mobile-first World Cup entertainment and sports-analysis experience where a playful animated octopus reveals a deterministic, source-backed prediction for the featured match. OctoOracle combines official fixture data, structured statistical signals, and approved public-source research without presenting predictions as certainty or wagering advice.

## Features

- **Featured match selection:** Resolves the next scheduled World Cup match and keeps an active match featured until its final result is known.
- **Deterministic predictions:** Produces reproducible outcome probabilities, expected goals, a compatible scoreline, confidence, and public explanation.
- **Animated aquarium reveal:** A Phaser-powered octopus performs the stored prediction with a repeatable animation seed.
- **Group and knockout handling:** Supports group-stage draws and separates a knockout match's predicted 90-minute score from the team predicted to advance.
- **Live fixture integration:** Uses football-data.org v4 behind a provider-neutral adapter and validates all provider responses.
- **Versioning and freezing:** Preserves prediction history, freezes predictions exactly at kickoff using server UTC, and never silently edits frozen records.
- **Results and accuracy:** Synchronizes completed results, records revisions, and compares frozen predictions with real outcomes.
- **Automatic prediction recording:** Protected fixture sync publishes the earliest due predictions up to 48 hours before kickoff in bounded batches, refreshes eligible predictions every three hours, freezes due predictions, and backfills reviewed preview-ledger forecasts without overwriting stored history.
- **Private daily recovery ledger:** Reviewed forecasts are grouped internally by Eastern match day so missing Supabase records can be restored without exposing the backup table to users.
- **FIFA ranking context:** Match cards show the supplied June 11, 2026 men's ranking snapshot, and available ranking comparisons appear in prediction explanations.
- **Secure research pipeline:** Fetches only server-controlled, allowlisted HTTPS sources and validates strict structured observations before they influence the model.
- **Mobile and accessible UI:** Includes responsive layouts, semantic prediction text, keyboard activation, reduced motion, and animation skipping.
- **Honest fallback states:** Clearly reports stale data, unavailable providers, unknown teams, in-progress matches, and predictions that are not ready.

## Prerequisites

- Node.js 24
- npm 11
- A football-data.org API key for live fixtures and provider previews
- A Supabase project for persistent fixtures, predictions, research observations, and results
- An OpenAI API key only when secure public-source research is enabled

## Setup

Clone the repo:

```text
git clone https://github.com/DarwinJavier/octoracle.git
cd octoracle
```

Install dependencies and generate the runtime assets:

```text
npm install
npm run assets:build
```

Configure environment variables:

```text
copy .env.example .env.local
```

Then open `.env.local` and fill in the values needed for the features you want to run:

| Variable                    | Required          | Description                                                                    |
| --------------------------- | ----------------- | ------------------------------------------------------------------------------ |
| `DATABASE_URL`              | No                | Direct database URL for tooling or migrations that require it                  |
| `SUPABASE_URL`              | For persistence   | Supabase project URL                                                           |
| `SUPABASE_ANON_KEY`         | No                | Public Supabase key reserved for approved client-side use                      |
| `SUPABASE_SERVICE_ROLE_KEY` | For persistence   | Server-only key used by protected repositories and jobs                        |
| `FOOTBALL_DATA_API_KEY`     | For live data     | football-data.org v4 API key                                                   |
| `OPENAI_API_KEY`            | For research      | Server-only OpenAI API key                                                     |
| `OPENAI_RESEARCH_MODEL`     | For research      | OpenAI model used for strict structured extraction                             |
| `INTERNAL_CRON_SECRET`      | For internal jobs | Bearer secret for protected internal endpoints                                 |
| `APP_BASE_URL`              | Yes               | App URL, such as `http://localhost:3000`                                       |
| `PREDICTION_FREEZE_MINUTES` | Yes               | Minutes before kickoff when predictions freeze; authoritative MVP value is `0` |
| `FIXTURE_STALE_MINUTES`     | Yes               | Fixture age that triggers a stale-data warning                                 |
| `ALLOWED_RESEARCH_DOMAINS`  | For research      | Deployment-selected domains from the reviewed hardcoded allowlist              |
| `RESEARCH_SOURCE_URLS`      | For research      | Server-controlled research URLs; never accepts public user input               |

Never give service-role, provider, model, or cron secrets a `NEXT_PUBLIC_` prefix.

## Supabase setup

1. Create a Supabase project.
2. Apply every SQL file in `supabase/migrations/` in filename order.
3. Configure `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `FOOTBALL_DATA_API_KEY`, and `INTERNAL_CRON_SECRET`.
4. Trigger fixture synchronization with `POST /api/internal/sync-fixtures`, an exact bearer secret, and an `Idempotency-Key` header. The protected sync also publishes or refreshes due predictions and freezes predictions at kickoff.
5. Add `INTERNAL_CRON_SECRET` as a GitHub Actions repository secret. The scheduled sync workflow calls fixture/prediction and result synchronization every 15 minutes; both jobs are independent so a failure in one does not prevent the other.
6. Configure any separate research-ingestion schedule only when approved sources are enabled; prediction and result persistence are already covered by the GitHub workflow.

The service-role privilege migration is required when migrations are applied through the Supabase SQL Editor.

## Run

Start the development server:

```text
npm run dev
```

Open `http://localhost:3000`.

Without stored Supabase fixtures, the app can show a clearly labeled live-provider preview when `FOOTBALL_DATA_API_KEY` is configured. Without either source, local development uses a clearly labeled illustrative fixture rather than pretending it is live data.

Create and run a production build:

```text
npm run build
npm start
```

## Tests

Run the complete local acceptance suite:

```text
npm run check
```

Run individual checks:

```text
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run test:integration
npm run test:assets
npm run build
npm run test:e2e
```

## API

Public read-only endpoints:

```text
GET /api/health
GET /api/matches/next
GET /api/matches/:matchId
GET /api/matches/:matchId/prediction
GET /api/predictions/history?limit=20 # limit is optional; omitted returns all history
```

Protected internal endpoints:

```text
POST /api/internal/sync-fixtures
POST /api/internal/research-match
POST /api/internal/build-prediction
POST /api/internal/sync-results
```

Internal routes require secret authentication, an idempotency key, rate limiting, validated requests, and a database lock. Public routes expose no write methods.

## Project structure

```text
octoracle/
|-- src/
|   |-- app/                         # Next.js pages, layouts, and API route handlers
|   |-- components/                  # Aquarium, match, prediction, and UI components
|   |-- game/                        # Phaser scene setup and animation state machine
|   |-- lib/
|   |   |-- db/                      # Supabase repositories and authentication
|   |   |-- fixtures/                # Provider adapter, normalization, sync, and resolver
|   |   |-- history/                 # Completed prediction history
|   |   |-- prediction/              # Deterministic engine, signals, and lifecycle
|   |   |-- public-data/             # Validated public data loading and fallbacks
|   |   |-- research/                # Allowlisted fetch, extraction, and consensus
|   |   |-- results/                 # Result synchronization and normalization
|   |   `-- security/                # Protected internal-job controls
|   `-- types/                       # Shared public response types
|
|-- sprites/                         # Source asset masters
|-- public/assets/                   # Generated runtime assets; not committed
|-- scripts/                         # Asset build and validation scripts
|-- supabase/migrations/             # Ordered database schema and lifecycle migrations
|-- tests/
|   |-- unit/                        # Unit and component tests
|   |-- integration/                 # Route, repository, migration, and job tests
|   `-- e2e/                         # Playwright browser tests
|
|-- docs/                            # Architecture, security, data, and model documentation
|-- AGENTS.md                        # Engineering, security, data, and product rules
|-- PROJECT_BRIEF.md                 # Product context and UX direction
|-- ASSET_MANIFEST.md                # Authoritative production asset inventory and usage
|-- PLAN.md                          # Delivery checklist and implementation reports
|-- .env.example                     # Environment variable template
`-- package.json                     # Dependencies and npm scripts
```

## Assets

`ASSET_MANIFEST.md` is the single source of truth for production filenames, dimensions, transparency, display sizes, anchors, and layer order.

Keep source masters unchanged in `sprites/`. Run `npm run assets:build` to generate optimized PNG files under `public/assets/`, and run `npm run test:assets` to validate the source inventory and runtime exports. The aquarium glass overlay remains excluded until it is repaired or replaced through review.

## Prediction and research rules

- The final outcome comes from versioned application code, not directly from an LLM or the animation.
- Predictions freeze exactly at kickoff using server UTC and cannot be regenerated after kickoff.
- Scorelines must be consistent with the selected outcome.
- Research uses only server-controlled URLs from approved domains.
- Retrieved content is treated as untrusted data, sanitized to plain text, and validated with strict schemas.
- Betting odds, wagering data, arbitrary user-provided URLs, and provider prediction products are never requested or stored.

See `docs/PREDICTION_MODEL.md`, `docs/DATA_SOURCES.md`, and `docs/SECURITY.md` for the full design.

## Vercel deployment

Vercel auto-detects the project as Next.js. No custom build command or output directory is required. The repository pins Node.js 24 and generates ignored runtime assets during `npm run build`.

Deploy from the connected GitHub repository or run:

```text
npx vercel
npx vercel --prod
```

Set `APP_BASE_URL` to the final production URL after the first deployment and keep all secrets server-side.

## Authoritative documents

- `AGENTS.md` - engineering, security, data, and product rules
- `PROJECT_BRIEF.md` - product and UX direction
- `ASSET_MANIFEST.md` - production asset names and usage
- `PLAN.md` - staged delivery checklist and implementation reports

When documents conflict, follow `AGENTS.md` for engineering and security rules and `ASSET_MANIFEST.md` for all asset details.
