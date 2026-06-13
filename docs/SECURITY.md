# Security

## Security Boundaries

- Keep provider, database service-role, model, and cron secrets server-side.
- Never expose privileged actions through public write endpoints.
- Validate every external response and reject unknown structured fields.
- Never accept an arbitrary research URL from a public user.
- Never allow retrieved content to trigger tools, code, database administration, deployment actions, or further network requests.
- Do not log secrets, authorization headers, full external pages, hidden prompts, or unnecessary personal data.

## Protected Jobs

Internal ingestion and synchronization jobs must use secret authentication, request schemas, rate limiting, idempotency keys, and database locks. They must be safe to retry.

The fixture route enforces an exact bearer secret with timing-safe comparison, a validated `Idempotency-Key`, a strict request body, a process-local burst limit, an expiring database lock, and service-role-only persistence. Its provider client can call only the fixed football-data.org World Cup endpoint and validated numeric team-history endpoints with bounded date windows. Failed jobs store a sanitized error code and never log provider keys or authorization headers.

The prediction-build route accepts only an internal match UUID. It cannot accept URLs, weights, team identities, signals, or provider endpoint overrides. It writes a validated signal snapshot before publishing through the immutable prediction lifecycle.

## Public Reads

- Public API routes expose GET handlers only.
- Database reads occur server-side with the service role; credentials never enter browser bundles or public responses.
- The service role receives explicit table, sequence, and RPC grants through `20260611110000_service_role_privileges.sql`; `anon` and `authenticated` retain no application-table access.
- Every stored row and public response is validated with Zod.
- Responses omit provider internals, input snapshots, raw observations, prompts, secrets, and write capabilities.
- Browser-rendered provider flags must use HTTPS from `crests.football-data.org`; unapproved URLs become visible FIFA-code fallbacks.

## Research Ingestion

- The protected endpoint accepts no URL field. URLs come only from server-controlled configuration.
- Deployment-selected domains must be a subset of the reviewed hardcoded federation allowlist.
- Fetching requires HTTPS and validates every manual redirect against the allowlist.
- Requests have timeouts, response-size limits, and expected `text/html` or `text/plain` content types.
- Scripts, styles, forms, navigation, comments, hidden active elements, tags, and control characters are stripped before extraction.
- Retrieved text is explicitly marked untrusted and cannot trigger tools, commands, URL fetches, or writes.
- The OpenAI Responses API request includes no tools and requires a strict JSON Schema Structured Output with unknown properties forbidden.
- The Structured Outputs request shape follows the [official OpenAI Structured Outputs guide](https://developers.openai.com/api/docs/guides/structured-outputs).
- Zod validates the result again before persistence.
- Observations are deduplicated by content hash, capped per domain, and persisted idempotently.
- The research job uses authentication, rate limiting, a database lock, a completed-run check, sanitized job records, and service-role-only observation writes.
- Consensus can influence validated numerical inputs but has no access to prediction publication.

## Result Synchronization

- Result writes use a protected internal endpoint with bearer authentication, strict body schema, rate limiting, idempotency, and a database lock.
- Only validated completed fixtures with complete scores and a valid participant winner are accepted.
- Transactional writes create result-revision audit rows and never modify prediction records.
- Prediction history is exposed through a read-only validated public endpoint.
