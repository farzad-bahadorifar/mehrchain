# T00 signup contract review handoff

> This historical record describes the former hosting setup. Production now runs on Deplexo.
> See the [current deployment guide](production_deployment.md).

Prepared October 17, 2026 (Asia/Tehran). Changes are uncommitted for owner review.
No build, test, Prisma generation, HTTP probe, database connection, migration,
deployment, commit or push was performed. **Production acceptance remains pending.**

## Findings and implementation

- Both current request DTOs already whitelist optional `timeZone`, and both
  frontend signup paths send it. `AuthService` persists a validated account IANA
  timezone on creation, defaults older clients to UTC and preserves an existing
  account's zone. These behaviors are retained. Dropping the field or relaxing
  unknown-field validation would hide a release mismatch.
- The reported `property timeZone should not exist` is consistent with an older
  backend contract. A stale deployed backend is still a hypothesis: no live
  endpoint, deployed SHA, response status or database history was verified here.
- Render's release build now regenerates Prisma Client and bypasses Nx's build
  cache. Webpack already cleans its backend output directory. The served artifact
  contains its build-time revision and timestamp, logs them on startup and exposes
  them through uncached `GET /api/version`, with
  `authContract: "account-timezone-v1"`. It contains no configuration secrets.
  Changing runtime `RENDER_GIT_COMMIT` cannot relabel an already-built bundle.
- The Render health check uses `/api/version`. Production startup first checks
  that the calendar and lifecycle columns required by this revision are readable,
  using `LIMIT 0` without retrieving account data. A failed probe prevents startup;
  it never applies migrations. This is a schema compatibility guard, not evidence
  of migration history, checksums, defaults or the unique daily-event index.
- Both checked-in Pages proxy copies target
  `https://mehrchain-api.onrender.com` and preserve `/api`, bodies, statuses and
  backend cache headers. They did not need a contract change. Verify that the
  deployed Pages project actually uses these functions and this target.
- `release-migrate.cjs` replaces its ignored prepared migration directory on each
  invocation, so files from a previously selected revision cannot linger. Paths
  resolve from the script location. Applied SQL and migration history are unchanged.
- Added HTTP regression coverage through the actual auth controller, shared
  bootstrap `ValidationPipe`, exception filter and `AuthService`. It covers email
  and Google timezone persistence, omitted UTC fallback, unknown fields, invalid
  IANA zones/types and existing-account compatibility. Database, email and JWT are
  substituted; the Google test token is the existing non-production test path.
  Separate production-readiness tests cover failed schema probes. Tests were written
  but not executed; they do not prove Google provider, mail delivery or PostgreSQL
  behavior.

## Owner release sequence

1. Record the Pages deployment SHA, Render deployed SHA, actual dashboard
   build/start commands, build/start logs and active proxy target. Compare with the
   reviewed source revision. `render.yaml` alone does not confirm the existing
   service's dashboard configuration. Record the reported failure's route, HTTP
   status and validation message privately without request bodies, email addresses,
   credentials or tokens. Compare `/api/version` directly on Render and through
   Pages; a 404 can indicate an older backend or a routing mismatch.
2. Privately match Render's database to the intended Neon branch and inspect the
   applied migration names/checksums. Do not assume the local `.env` is production.
   Back up and rehearse the selected revision on a disposable populated copy using
   [the database procedure](database_migration_procedure.md) and
   [T02's preservation checks](t02_review_handoff.md). Capture before/after counts,
   all pre-existing fields, UTC dates, duplicate logs and recovery results outside
   version control. Confirm the daily-event unique index and timezone defaults.
3. Inspect **every** pending migration in the selected revision. Current `main`
   already contains committed T03 (`2f1cff1`); its backend needs both
   `20261017000000_account_calendar` and `20261017100000_habit_lifecycle` after
   the October 5 baseline and October 6 daily hearts migration. Deploying only
   the calendar SQL with this backend is insufficient. If releasing the earlier
   T02 revision instead, use its matching schema, code and migration chain; this
   working-tree patch is prepared against current `main`. Do not include unrelated
   unreviewed changes or manually remove a required migration.
4. For a target already using the reviewed release baseline, inspect pending
   status, apply the rehearsed release chain, then repeat status/deploy and check
   zero schema drift. Run from the repository root with the selected direct
   database connection supplied privately as `DATABASE_URL`:

   ```powershell
   node scripts/release-migrate.cjs status
   node scripts/release-migrate.cjs deploy
   node scripts/release-migrate.cjs status
   node scripts/release-migrate.cjs deploy
   npx prisma migrate diff --from-schema-datasource apps/mehrchain-backend/prisma/schema.prisma --to-schema-datamodel apps/mehrchain-backend/prisma/schema.prisma --exit-code
   ```

   Pending migrations can make `status` exit nonzero; inspect its report before
   continuing. Do not resolve the baseline again, reset the database, use db push
   or run the historical migration directory. If the target is legacy/unbaselined,
   stop this sequence and rehearse the expanded legacy procedure first.
5. After schema verification, use the new Render build command from `render.yaml`
   and start `node dist/mehrchain-backend/main.js`. For a local build after review,
   `npm run build:backend:release` runs generation and a fresh backend build.
   Deployment builds should use a clean reviewed commit. Compare the complete
   build-time SHA and timestamp returned by both URLs:

   ```text
   https://mehrchain-api.onrender.com/api/version
   https://mehrchain.pages.dev/api/version
   ```

   Both must identify the intended backend revision and timezone contract. A
   successful version response does not prove auth acceptance. If they disagree,
   inspect Pages routing; if both are old, inspect Render revision, build command,
   reused artifacts and logs. Keep strict request validation enabled.
6. Run the new focused tests when desired, then verify real email registration,
   OTP delivery/verification, Google signup/login, existing-account login and
   `/api/auth/me` through Pages. A new Tehran account must retain `Asia/Tehran`;
   an existing UTC account must stay UTC after login from a Tehran device.
   Repeat registration after updating an installed PWA; confirm its active Pages
   revision. Preserve existing rows/history and exercise the older client without
   `timeZone`. Invalid creation zones and unrelated fields must return 400.

## Acceptance record (to be filled after execution)

| Evidence | Result |
| --- | --- |
| Original route/status/validation response | Not verified |
| Pages SHA / Render build-time SHA and timestamp | Not verified |
| Active proxy target / direct and proxied version match | Not verified |
| Target database identity / migration names and checksums | Not verified |
| Populated-copy preservation / repeat deploy / zero drift / recovery | Not run |
| Focused HTTP regression and readiness tests | Not run |
| Email registration / delivery / verification / profile timezone | Not run |
| Google new account / returning account / profile timezone | Not run |
| Existing UTC account and history / old client / updated PWA | Not run |

Keep T00 open until deployed acceptance is recorded. T02's wider daily-boundary
and T03's lifecycle acceptance remain separate.
