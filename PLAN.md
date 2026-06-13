# OctoOracle 2026 Delivery Plan

## Delivery Protocol

- Complete and report one numbered step before beginning the next.
- Record changed files, decisions, commands, results, relevant quality checks, open issues, and the next step in each report.
- Keep this file current as the persistent implementation checklist.
- Do not mark a step complete until its acceptance checks pass.

## Locked Decisions

- Predictions freeze exactly at kickoff using server UTC.
- No prediction is generated or refreshed after kickoff.
- `featuredMatch` keeps an active match visible until it finishes; `nextScheduledMatch` resolves the earliest eligible future match.
- Group-stage draw predictions use a neutral octopus shrug without a central physical choice.
- The fully opaque `aquarium-glass-overlay.png` is omitted from the prototype. Its manifest entry and partial-alpha production requirement remain unchanged until a reviewed repair or replacement.
- Use a replaceable text/CSS wordmark initially.
- Use validated provider-hosted team flags with a FIFA-code fallback.
- football-data.org v4 is the initial fixture provider behind an adapter; the configured free account includes FIFA World Cup access.
- Never request or store odds, wagering data, or provider prediction products.

## Audit Baseline

- The initial workspace contained only `AGENTS.md`, `PROJECT_BRIEF.md`, `ASSET_MANIFEST.md`, and 27 PNG source masters.
- All 27 manifest filenames are present and all source dimensions match the manifest.
- The 25 transparent assets other than `aquarium-glass-overlay.png` contain real alpha.
- `aquarium-glass-overlay.png` is fully opaque and visibly contains a baked checkerboard.
- The source sprite directory is approximately 35 MB and requires optimized runtime exports.
- The initial workspace had no Git repository or application scaffold.

## Step Checklist

- [x] **Step 0: Establish Project Governance**
  - Initialize Git.
  - Create the governance and supporting documents.
  - Reconcile asset validation, animation names, kickoff freeze behavior, and featured-match behavior.
  - Validate document links, manifest-to-disk filenames, and committed-file secrets.
- [x] **Step 1: Scaffold the Application and Asset Pipeline**
- [x] **Step 2: Build the Static Mobile-First Experience**
- [x] **Step 3: Implement the Deterministic Aquarium Animation**
- [x] **Step 4: Add Database and Live Fixture Synchronization**
- [x] **Step 5: Implement the Deterministic Baseline Prediction Engine**
- [x] **Step 6: Connect Public APIs and Front End**
- [x] **Step 7: Add Secure Public-Source Consensus**
- [x] **Step 8: Add Results, History, and Accuracy**
- [ ] **Step 9: Launch Readiness**

## Step 0 Report

**Status:** Complete on 2026-06-09.

**Completed work**

- Initialized the Git repository.
- Added `PLAN.md`, `.gitignore`, `.env.example`, `README.md`, and the required supporting documents.
- Reconciled the authoritative prediction freeze policy to kickoff.
- Defined separate featured-match and next-scheduled-match behavior.
- Replaced obsolete animation aliases with exact manifest filenames.
- Corrected the stale asset-validation summary and documented the temporary glass-overlay omission.

**Decisions**

- Documentation-only governance checks remain simple PowerShell commands until Step 1 adds the standard npm scripts.
- Supporting documents describe approved boundaries and future implementation intent; they do not claim unimplemented capabilities.

**Validation results**

- Relative Markdown link validation: **Pass**; every local link resolves.
- Manifest-to-disk filename comparison: **Pass**; both contain the same 27 PNG filenames.
- High-risk secret scan: **Pass**; no populated provider, model, service-role, cron, or OpenAI-style secrets detected.
- Stale-policy and obsolete-animation-alias scan: **Pass**.
- Git whitespace validation with `git diff --check`: **Pass**.

**Open issues**

- `aquarium-glass-overlay.png` must be repaired or replaced before it can be loaded.
- The football-data.org free-plan update cadence and 2026 World Cup payloads must be verified before launch.
- The app scaffold and standard scripts begin in Step 1.
- Git uses its initialized default `master` branch; an optional rename to `main` was blocked by local `.git` lock permissions and is not required for Step 0.

**Next step**

- Step 1: scaffold the application and asset pipeline after Step 0 review.

## Step 1 Report

**Status:** Complete on 2026-06-09.

**Completed work**

- Scaffolded Next.js App Router with strict TypeScript, React, Tailwind CSS, Phaser 3, Zod, Vitest, Playwright, ESLint, and Prettier.
- Added the standard `format:check`, `lint`, `typecheck`, `test`, `test:integration`, `test:e2e`, `test:assets`, `build`, and aggregate `check` scripts.
- Added a minimal semantic starter page and application metadata.
- Added deterministic runtime asset generation from the untouched `sprites/` source masters into the manifest-defined `public/assets/` structure.
- Excluded `aquarium-glass-overlay.png` from runtime generation.
- Added asset validation for inventory, source dimensions, alpha behavior, runtime limits, aspect ratios, missing exports, omitted assets, and visible border pixels.
- Added narrowly scoped runtime cleanup for small disconnected mascot artifacts near image edges.
- Added unit, integration, mobile-browser, and desktop-browser smoke tests.
- Added GitHub Actions CI for install, asset generation, formatting, linting, types, tests, asset validation, production build, and browser smoke tests.
- Updated the README with setup, validation, and runtime-asset instructions.

**Decisions**

- Pinned Phaser to the latest compatible Phaser 3 release, `3.90.0`, instead of npm's current Phaser 4 release.
- Pinned and overrode PostCSS to `8.5.15` to resolve the reported XSS advisory while satisfying Next and Tailwind's dependency requirements.
- Kept runtime assets generated and ignored rather than committing derived files.
- Used isolated port `3107` for Playwright so tests cannot accidentally reuse another local application on port 3000.

**Validation results**

- Clean lockfile installation with `npm ci`: **Pass**; 474 packages installed and 0 vulnerabilities reported.
- Complete `npm run check`: **Pass**.
- Formatting: **Pass**.
- ESLint with zero warnings: **Pass**.
- Strict TypeScript: **Pass**.
- Unit smoke test: **Pass**, 1 test.
- Integration smoke test: **Pass**, 1 test.
- Asset validation: **Pass**, 27 source assets and 26 runtime exports.
- Runtime asset generation: **Pass**; glass overlay omitted and 642 stray mascot-edge pixels removed from generated exports.
- Runtime asset size: approximately 15.0 MB, a 57.2% reduction from the approximately 35.1 MB source masters.
- Next.js production build: **Pass**.
- Playwright browser smoke tests: **Pass**, mobile Chromium and desktop Chromium.
- npm security audit: **Pass**, 0 vulnerabilities.
- Local boot check: **Pass**, HTTP 200 with the expected OctoOracle content.

**Open issues**

- `aquarium-glass-overlay.png` remains fully opaque with a baked checkerboard and must stay omitted until a reviewed repair or replacement.
- Full multi-background visual composite review of every runtime asset remains required before launch.
- A fixture provider with included World Cup access must be verified before Step 4.
- The in-app visual browser helper could not start in the managed Windows environment; Playwright completed the required mobile and desktop rendering checks.

**Next step**

- Step 2: build the static mobile-first experience after Step 1 review.

## Step 2 Report

**Status:** Complete on 2026-06-09.

**Completed work**

- Replaced the scaffold page with a semantic, portrait-first static match experience.
- Added the confirmed opening Group A fixture, Mexico vs South Africa at Mexico City Stadium on June 11, 2026 at 19:00 UTC.
- Added replaceable wordmark treatment, team identifiers and flag fallbacks, stage, group, match number, venue, official UTC kickoff, viewer-local kickoff, and live countdown.
- Added a static aquarium composition using validated runtime assets while keeping all essential information outside the visual layer.
- Added a keyboard-operable “Ask the Octopus” reveal with selected outcome, compatible predicted score, probabilities, confidence, explanation, reason labels, timestamps, version, source count, and disclaimer.
- Added validated query-driven preview states for stale fixtures, prediction not ready, and fixture-provider unavailable.
- Prevented the not-ready state from exposing a prediction reveal.
- Added reduced-motion CSS behavior and semantic probability meters.
- Documented the static fixture source and explicitly labeled the Step 2 prediction illustrative with zero approved public sources.

**Decisions**

- Use the confirmed opening match as the typed static fixture so the page presents a realistic group-stage draw scenario.
- Use emoji flags with visible FIFA-code fallbacks until validated provider-hosted flags are integrated.
- Use a source count of zero and illustrative language until the approved research pipeline exists; do not imply that Step 7 work has already happened.
- Render UTC on the server and enhance to the viewer's local timezone in the browser; retain UTC if localization fails.
- Keep the aquarium as a static accessible preview until Phaser replaces it in Step 3.

**Validation results**

- Complete `npm run check`: **Pass**.
- Formatting, ESLint with zero warnings, and strict TypeScript: **Pass**.
- Unit tests: **Pass**, 7 tests covering static content, reveal behavior, fallback integrity, UTC formatting, daylight-saving conversion, and countdown behavior.
- Integration smoke test: **Pass**, 1 test.
- Asset validation: **Pass**, 27 source assets and 26 runtime exports.
- Next.js production build: **Pass**.
- Playwright browser tests: **Pass**, 8 tests across mobile and desktop Chromium.
- Browser coverage includes reveal flow, screenshots, honest fallback state, keyboard activation, reduced motion, viewer-local time, probability semantics, and fully revealed layout at exactly 320 CSS pixels without horizontal scrolling.
- Manual screenshot review: **Pass** for mobile and desktop hierarchy, readability, composition, and contrast.

**Open issues**

- The displayed prediction is illustrative, not a real model output; the deterministic model begins in Step 5 and public-source consensus begins in Step 7.
- The aquarium is a static composition; deterministic Phaser state-machine behavior begins in Step 3.
- Emoji flag rendering varies by operating system; provider-hosted flags with FIFA-code fallback arrive with live fixture integration.
- `aquarium-glass-overlay.png` remains omitted pending reviewed repair or replacement.

**Next step**

- Step 3: implement the deterministic aquarium animation after Step 2 review.

## Step 3 Report

**Status:** Complete on 2026-06-09.

**Completed work**

- Replaced the static aquarium composition with a client-only Phaser 3 scene using a 1280 × 720 logical canvas and `Phaser.Scale.FIT`.
- Added a pure deterministic state machine covering `idle`, `intro`, both team inspections, conditional draw inspection, hesitation, choose, open container, eat, celebrate, reveal, and complete.
- Added a seeded pseudo-random generator for reproducible idle and hesitation pose variations.
- Mapped team A, draw, and team B outcomes to their required manifest textures without allowing the scene to change the stored outcome.
- Used exact manifest filenames, default target positions, logical display sizes, anchors, and layer order while continuing to omit the broken glass overlay.
- Connected the semantic result reveal to Phaser completion through one client experience controller.
- Added Ask, skip, replay, reduced-motion immediate completion, explicit scene state text, loading state, and asset-failure fallback.
- Prevented controls from enabling before the Phaser scene finishes its lifecycle setup.
- Disabled Phaser visibility pausing so a short deterministic ritual completes consistently when a tab briefly backgrounds.
- Documented the animation architecture and advanced the README milestone status.

**Decisions**

- Keep the state machine and seeded variation logic independent of Phaser so outcome selection and replay behavior are unit-testable.
- Reveal the semantic prediction only after animation completion, skip, reduced-motion completion, or an explicit asset-failure fallback.
- Preserve the same animation seed on replay; replay changes no outcome, score, probability, or prediction metadata.
- Keep the canvas decorative and expose current animation state plus all prediction information as semantic HTML.

**Validation results**

- Complete `npm run check`: **Pass**.
- Formatting, ESLint with zero warnings, and strict TypeScript: **Pass**.
- Unit tests: **Pass**, 14 tests including deterministic replay, all three outcome mappings, conditional draw inspection, required state ordering, fallback integrity, and time behavior.
- Integration smoke test: **Pass**, 1 test.
- Asset validation: **Pass**, 27 source assets and 26 runtime exports.
- Next.js production build with client-only Phaser bundle: **Pass**.
- Playwright browser tests: **Pass**, 12 tests across mobile and desktop Chromium.
- Browser coverage includes full animation completion, stored-result reveal, skip, replay, reduced motion, keyboard activation, asset-failure fallback, honest not-ready state, and exact 320 CSS pixel layout.
- Parallel browser run with background tabs: **Pass** after disabling Phaser visibility pausing.
- Manual screenshot review: **Pass** for selected-box opening/highlight, celebration, reveal burst, canvas composition, mobile readability, and semantic result placement.

**Open issues**

- Step 3 visually exercises the current stored team A outcome; draw and team B outcome mapping are covered by deterministic unit tests and will gain fixture-driven browser scenarios after live data contracts exist.
- The displayed prediction remains illustrative until the deterministic model is implemented in Step 5.
- The glass overlay remains omitted pending reviewed repair or replacement.
- Audio and final motion polish remain launch-phase work.

**Next step**

- Step 4: add database and live fixture synchronization after Step 3 review.

## Step 4 Report

**Status:** Complete on 2026-06-09.

**Completed work**

- Added the initial Supabase migration for teams, matches, source observations, predictions, job runs, indexes, constraints, RLS, revoked client access, and an expiring serverless job lock.
- Added strict normalized fixture/team contracts and a provider-neutral `FixtureProvider` boundary.
- Added a provider-neutral fixture boundary and initially implemented a paid-provider adapter; it was later replaced by football-data.org v4 after confirming free World Cup access.
- Added deterministic `featuredMatch` and `nextScheduledMatch` resolvers with active-match retention, simultaneous kickoff tie-breaking, stale-data state, and tournament-complete state.
- Added idempotent fixture synchronization, team-before-match upserts, sanitized success/failure job records, a service-role Supabase REST repository, and a protected internal route.
- Added offline unit and integration coverage for provider normalization, malformed responses, fixed endpoints, resolver behavior, authentication, idempotency, locks, and provider outages.
- Fixed the reduced-motion path so semantic prediction reveal is immediately available without waiting for Phaser or canvas assets.

**Decisions**

- Keep the public page on its validated static fixture until Step 6 connects read-only public APIs.
- Treat suspended matches as active featured matches until a final state is known.
- Do not persist a live score as a 90-minute or final result; those fields remain null until a finished status.
- Use a small `job_locks` table because a serverless sync spans multiple PostgREST requests and needs an atomic expiring coordination record.
- Use Supabase PostgREST directly to avoid adding a client dependency for the narrow Step 4 service-role repository.

**Validation results**

- Formatting, ESLint with zero warnings, and strict TypeScript: **Pass**.
- Unit tests: **Pass**, 24 tests.
- Integration tests: **Pass**, 4 tests.
- Asset validation and production build: **Pass**.
- Existing mobile and desktop browser suite: **Pass**, 12 tests.
- Secret scan and Git whitespace validation: **Pass**.
- Live provider/Supabase smoke test: **Not run during Step 4**; credentials were configured later.

**Open issues**

- football-data.org's exact production state/score payloads and delayed-update behavior must be verified before enabling scheduled synchronization.
- Supabase migration and service-role repository require a configured project before a live smoke test can pass.
- The process-local burst limiter supplements authentication and database locking but should be replaced or backed by shared infrastructure before multi-region launch.
- The public experience intentionally remains static until Step 6.

**Next step**

- Step 5: implement the deterministic baseline prediction engine after Step 4 review.

## Step 5 Report

**Status:** Complete on 2026-06-09.

**Completed work**

- Added strict symmetric numerical prediction inputs using internal match and team UUIDs.
- Added version-controlled baseline weights and algorithm/model versions.
- Implemented deterministic weighted ratings, three-outcome softmax normalization, expected goals, and compatible independent-Poisson score selection.
- Added group-stage draw handling and separate knockout 90-minute outcome and advancing-team behavior.
- Added deterministic snapshot hashes, animation seeds, confidence labels, reason codes, and concise explanations.
- Added a prediction lifecycle service that rejects stale, non-scheduled, and post-kickoff generation.
- Added transactional Supabase functions for version publication, supersession, exact-kickoff freezing, and voiding incompatible frozen predictions.
- Added a database trigger preventing analytical edits to stored prediction versions.
- Added a service-role Supabase prediction repository and reproducibility/lifecycle test coverage.

**Decisions**

- Keep all baseline input families on a symmetric validated `0` to `1` scale.
- Use the documented `40/20/15/10/15` development weights as algorithm version `baseline-1.0.0`; any weight or calculation change requires a version increment.
- Make draw affinity increase as the teams' weighted ratings converge.
- Choose the most likely score only from scorelines compatible with the selected outcome.
- Keep the public page illustrative until Step 6 connects stored read-only data.

**Validation results**

- Formatting, ESLint with zero warnings, and strict TypeScript: **Pass**.
- Unit tests: **Pass**, 30 tests.
- Integration tests: **Pass**, 9 tests.
- Tests cover probability normalization, score consistency, group draws, knockout advancement, reproducibility, validation, versioning, exact-kickoff freeze, stale kickoff rejection, cancelled fixtures, postponement, and rescheduling.
- Full asset, production-build, and mobile/desktop browser acceptance suite: **Pass**.
- Secret scan and Git whitespace validation: **Pass**.
- Live Supabase migration/RPC smoke test: **Not run**; no configured project credentials are present.

**Open issues**

- The development baseline must be calibrated against historical international-match data before launch.
- Real team-strength, form, performance, and squad-availability ingestion is not yet implemented.
- Public-source consensus remains zero until Step 7.
- The static public page does not read stored predictions until Step 6.

**Next step**

- Step 6: connect read-only public APIs and the front end after Step 5 review.

## Step 6 Report

**Status:** Complete on 2026-06-09.

**Completed work**

- Added strict `FeaturedMatchResponse`, `PredictionResponse`, public match, team, and prediction schemas.
- Added a server-only public-data repository that validates Supabase match/team joins and stored predictions.
- Added deterministic public response states for upcoming, in-progress, finished, not-ready, stale, tournament-complete, and provider-error behavior.
- Added read-only health, featured-match, match-detail, and prediction-detail GET routes.
- Connected the server-rendered page to stored featured-match and prediction data.
- Kept active matches visible with their preserved frozen predictions and prevented the UI from implying that new predictions can be generated after kickoff.
- Added clearly labeled local demo fallback, semantic loading state, honest missing/error states, simultaneous-match response support, and approved-CDN flag rendering with FIFA-code fallback.
- Updated prediction presentation to show frozen timestamps and dynamic team names.

**Decisions**

- Keep Supabase RLS closed to browser clients; public GET routes read through a server-only service-role repository.
- Expose narrow validated public DTOs rather than database rows or prediction input snapshots.
- Treat unconfigured local development differently from provider/storage failure: development gets a labeled demo fixture, while read failures return `provider_error`.
- Permit provider-hosted flags only from `https://crests.football-data.org`.

**Validation results**

- Formatting, ESLint with zero warnings, and strict TypeScript: **Pass**.
- Unit tests: **Pass**, 33 tests.
- Integration tests: **Pass**, 12 tests.
- API schema, featured resolution, active retention, not-ready, stale, tournament-complete, and match-specific read tests: **Pass**.
- Full asset, production-build, and mobile/desktop browser acceptance suite: **Pass**.
- Browser coverage includes frozen prediction reload after kickoff, local-time display, loading/error semantics, reduced motion, animation skip, and exact 320 CSS pixel layout.
- Secret scan and Git whitespace validation: **Pass**.
- Live Supabase public-read smoke test: **Not run**; no configured project credentials are present.

**Open issues**

- Live stored-data behavior still requires applying migrations and configuring Supabase credentials.
- Public-source consensus remains unimplemented until Step 7.
- Prediction history and completed-result accuracy remain Step 8 work.

**Next step**

- Step 7: add secure public-source consensus after Step 6 review.

## Step 7 Report

**Status:** Complete on 2026-06-09.

**Completed work**

- Added a reviewed hardcoded federation-domain allowlist with deployment configuration restricted to a subset.
- Added a server-controlled research URL configuration and a protected endpoint whose request schema accepts no URLs.
- Added an HTTPS-only fetcher with manual redirect validation, timeout, response-size, content-type, credential, and domain controls.
- Added bounded HTML-to-plain-text sanitization that strips active and navigational content.
- Added an OpenAI Responses API Structured Outputs extractor with no tools, strict JSON Schema, untrusted-text instructions, and Zod revalidation.
- Added strict source-observation contracts and idempotent service-role persistence.
- Added duplicate-content suppression, per-domain influence caps, freshness weighting, independent-source sufficiency checks, and deterministic consensus signals.
- Added a bridge that updates only validated numerical consensus inputs and source count before the deterministic prediction engine runs.
- Added protected research job authentication, rate limiting, database locking, completed-run idempotency, and sanitized success/failure records.

**Decisions**

- Begin with official tournament/confederation domains only; expanding the hardcoded list requires human review.
- Require a server-configured OpenAI research model instead of silently choosing or changing a model.
- Require at least three independent meaningful domains before consensus influences prediction inputs; otherwise use neutral `0.5` signals.
- Allow at most two unique observations per domain and deduplicate identical content hashes across domains.
- Keep research and prediction publication as separate capabilities; the research endpoint cannot publish or modify a prediction.

**Validation results**

- Formatting, ESLint with zero warnings, and strict TypeScript: **Pass**.
- Unit tests: **Pass**, 44 tests.
- Integration tests: **Pass**, 17 tests.
- Security tests cover malicious source instructions, authenticated URL injection, unapproved redirects, HTTP rejection, unsupported content, oversized responses, model timeout, malformed/unknown Structured Output fields, duplicate sources, domain caps, insufficient sources, allowlist restriction, idempotent observation writes, job locks, and no public CORS/write path.
- Full asset, production-build, and mobile/desktop browser acceptance suite: **Pass**.
- Secret scan and Git whitespace validation: **Pass**.
- Live research/OpenAI/Supabase smoke test: **Not run**; no configured API keys, model, source URLs, or database credentials are present.

**Open issues**

- Exact production source URLs and automated-access permission must be reviewed before configuration.
- The initial official-domain-only allowlist intentionally excludes journalism and analytical publications until licensing/access review.
- Consensus calibration and source-quality scoring require historical evaluation before launch.
- Result synchronization and prediction accuracy remain Step 8 work.

**Next step**

- Step 8: add results, history, and accuracy after Step 7 review.

## Step 8 Report

**Status:** Complete on 2026-06-09.

**Completed work**

- Tightened provider score normalization to preserve separate 90-minute and final knockout scores.
- Added strict completed-result validation, including score completeness and winner-participant validation.
- Added a protected result synchronization endpoint with authentication, strict request body, rate limiting, idempotency, database locking, and sanitized job records.
- Added transactional result application and immutable result-revision auditing that preserves corrected results while deduplicating identical retries.
- Added deterministic accuracy calculation for 90-minute outcome, exact score, and separate knockout advancement.
- Added a frozen-prediction history RPC, server repository, strict public response schemas, and read-only history endpoint.
- Added public accuracy summaries, resolved prediction entries, final extra-time/penalty resolution display, and tournament-complete presentation.

**Decisions**

- Calculate accuracy at read time from the exact frozen prediction and latest validated result; do not store mutable accuracy flags.
- Treat outcome and exact-score accuracy as 90-minute measures, with knockout advancement reported separately.
- Preserve every distinct corrected result as a revision even if a provider reuses its update timestamp.
- Exclude drafts, superseded predictions, void predictions, and incomplete results from public history.

**Validation results**

- Formatting, ESLint with zero warnings, and strict TypeScript: **Pass**.
- Unit tests: **Pass**, 49 tests.
- Integration tests: **Pass**, 22 tests.
- Tests cover normal finish, extra time, penalties, incomplete results, invalid winners, corrected results, immutable frozen history, accuracy summaries, protected result synchronization, and tournament-complete history.
- Full asset, production-build, and mobile/desktop browser acceptance suite: **Pass**.
- Secret scan and Git whitespace validation: **Pass**.
- Live provider/Supabase result smoke test: **Not run during Step 8**; production results did not yet exist.

**Open issues**

- Production football-data.org regular-time/full-time/penalty score behavior must be verified against real completed 2026 fixtures.
- Historical accuracy is empty until live frozen predictions and completed results exist.
- Monitoring, scheduled result cadence, final asset repair, and deployment configuration remain Step 9 work.

**Next step**

- Step 9: launch readiness after Step 8 review.

## football-data.org Provider Migration Report

**Status:** Implementation complete on 2026-06-11; live Supabase sync awaits the service-role privilege migration.

**Completed work**

- Replaced the paid Sportmonks adapter with a fixed-endpoint football-data.org v4 adapter for competition code `WC`.
- Added strict payload validation, provider-status mapping, unknown-participant handling, separate 90-minute/final/penalty scores, and provider crest allowlisting.
- Updated fixture and result synchronization routes, tests, configuration, and documentation.
- Added support for both modern Supabase `sb_secret_...` keys and legacy service-role JWTs without exposing either to browser code.
- Added explicit service-role database grants in `20260611110000_service_role_privileges.sql` while retaining the anon/authenticated lockout.

**Live validation**

- The configured football-data.org free token successfully returned all 104 World Cup 2026 matches from June 11 through July 19, 2026.
- The configured Supabase service-role JWT is valid, unexpired, and belongs to the configured project.
- The first protected sync correctly failed closed because the manually applied schema had not granted `service_role` access to `job_runs`.

**Remaining action**

- Apply `supabase/migrations/20260611110000_service_role_privileges.sql` in the Supabase SQL Editor, then rerun the protected fixture sync.

## Live Prediction Input Pipeline Report

**Status:** Implementation complete on 2026-06-11; live publication awaits Supabase migrations and fixture synchronization.

**Completed work**

- Added a fixed, validated football-data.org team-history endpoint with a bounded two-year window and local result limit.
- Added deterministic historical strength, recent-form, attacking-performance, and defensive-performance signals.
- Kept unavailable history, squad availability, and insufficient consensus explicitly neutral rather than fabricating evidence.
- Added `prediction_signal_snapshots` to preserve normalized signals, source count, cutoff, algorithm version, input hash, and exact contributing provider match IDs.
- Added protected, authenticated, idempotent `POST /api/internal/build-prediction`.
- Connected live signal calculation to the existing immutable prediction publication lifecycle.

**Live validation**

- The team-history endpoint is accessible with the configured football-data.org key.
- For the next provider fixture, South Korea vs Czechia, the free plan currently returns zero South Korea historical matches and three Czechia historical matches in the bounded window.
- The configured Supabase project currently returns `403` for stored match reads and `404` for `prediction_signal_snapshots`.

**Remaining action**

- Apply all Supabase migrations through `20260611130000_prediction_signal_snapshots.sql`.
- Run protected fixture synchronization.
- Call `POST /api/internal/build-prediction` with the stored internal match UUID.
