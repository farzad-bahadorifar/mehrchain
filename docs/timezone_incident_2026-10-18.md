# Live auth timezone investigation — October 18, 2026

> This historical record describes the former hosting setup. Production now runs on Deplexo.
> See the [current deployment guide](production_deployment.md).

## Confirmed finding

The API serving production still exposes the pre-timezone auth contract. The
current frontend sends `timeZone`, but production request validation rejects that
property before Google token verification or account persistence. Both Google
entry points share `GoogleAuthService` → `AuthService.googleLogin()` →
`POST /api/auth/google`, explaining the identical signup and sign-in failure.

This is supported by live HTTP responses, rather than inferred only from source.
An authenticated Render inspection subsequently confirmed that no deployment of
the timezone fixes has run. The connected Git deployment credential does not list
the application's repository. No production release, permissions, service
configuration or database changes were performed during this investigation.

## Live observations

Probes ran around 22:50–22:52 Asia/Tehran (19:20–19:22 UTC).

| Probe | Observed response |
| --- | --- |
| `GET https://mehrchain-api.onrender.com/api/version` | HTTP 404, `Cannot GET /api/version` |
| `GET https://mehrchain.pages.dev/api/version` | HTTP 404, same missing route |
| Direct Render `GET /api/docs-json` | `GoogleAuthDto` exposes only `idToken`; `RegisterDto` has no `timeZone` |
| Direct Render and Pages `POST /api/auth/google`, body `{"idToken":"","timeZone":"Asia/Tehran"}` | HTTP 400 with `property timeZone should not exist` and `Google ID token cannot be empty` |
| Pages `POST /api/auth/google`, body `{"idToken":""}` | HTTP 400 with only `Google ID token cannot be empty` |
| Pages `POST /api/auth/register` with empty username/password, invalid email and `timeZone: "Asia/Tehran"` | HTTP 400 includes `property timeZone should not exist` alongside expected invalid-field errors |

All authentication probes used deliberately invalid inputs rejected by DTO
validation. No real identity, Google token, email delivery or new account was used.
The direct/proxied agreement locates the obsolete contract at the backend serving
Render, rather than only in the Pages proxy or an installed PWA cache. The live
responses reported dynamic cache status.

## Local verification

Source revision: `657eab1` on `main`. The timezone DTO change already exists in
`9643bda`; release-version instrumentation exists in `784d1ed`.

- `GoogleAuthDto` and `RegisterDto` explicitly whitelist optional `timeZone`.
- `npm run build:backend:release` completed successfully. The generated bundle
  includes the DTO metadata and `account-timezone-v1` version endpoint.
- Auth HTTP contract and production-readiness suites passed: 23 tests. The first
  ordinary Jest run could not load the ESM `@nestjs/passport` dependency. Rerunning
  with an in-memory Jest configuration that transpiles that package with ts-jest
  and `allowJs` succeeded; no checked-in test configuration was changed.
- An additional local HTTP harness used the real controller, AuthService and
  production validation pipe with `NODE_ENV=production`. Only database, mail,
  JWT issuance and the Google provider response were substituted. All eight checks
  passed: empty-token validation without rejecting timezone; Google/email timezone
  persistence; Google/email omitted-timezone UTC fallback; strict unknown-field
  rejection for both routes; preserving a returning Google account's UTC zone.
  This verifies application behavior with substituted dependencies, not production
  Google credentials or database compatibility.

## Authenticated Render findings

After the user signed into Render, the dashboard showed:

- Service `mehrchain-api` (`srv-dandihrtqb8s73bi54s0`) is live on commit
  `483f6c4dce26b87154fb8ea0dcc50cb05b512dd6`, a manual deployment about 12 days
  before this inspection. The commit's repository timestamp is October 6,
  00:40:04 Asia/Tehran. It predates both October 17 timezone fixes.
- There are six deploy records. No newer deployment attempt of the timezone fixes
  is recorded; this is not a newly failed timezone deployment retaining the old
  instance. The listed failures are older than the live successful deployment.
- The selected repository/branch is `farzad-bahadorifar/mehrchain`, `main`.
  A read-only `git ls-remote` confirmed GitHub main is actually
  `657eab16791289ef9bcc9fecfa013d1fcf53452e`, matching the local revision.
- Service Auto-Deploy displays `On Commit`; Blueprint Auto Sync displays `Yes`.
  Merely enabling those settings is therefore not the missing step.
- The linked Blueprint's sync history contains only `536177c` and `f91af4e`, both
  about a month old. The revised `render.yaml` has not been synchronized.
- The actual Build Command is still
  `npm install --include=dev && npx prisma generate --schema=apps/mehrchain-backend/prisma/schema.prisma && NX_DAEMON=false npx nx build mehrchain-backend`.
  The checked-in release command/cache bypass is not in use. Start Command is
  `node dist/mehrchain-backend/main.js`; Health Check Path is empty.
- In **Account settings → Git Deployment Credentials**, expanding the sole
  connected GitHub credential (`farzad-bahadorifar`) lists only two repositories,
  both under another repository owner. `farzad-bahadorifar/mehrchain` is absent.
  The service's Update Source picker independently reports `2 repos` and
  `No results for "mehrchain"` when searched. No source change was saved.

This establishes an outdated running backend and an incomplete current GitHub
repository connection. Restore/verify the Render GitHub App's access to the
specific `mehrchain` repository and event delivery before relying on automatic
deploys. The GitHub installation settings and webhook-delivery history have not
yet been inspected; whether the underlying cause is removed repository access,
an installation-scope issue or a stale credential is not yet individually proven.

## Release prerequisites

Before activating the current backend, verify the target database against the
reviewed release migrations in `docs/database_migration_procedure.md`. Current
production startup requires calendar, lifecycle and chain-heart ledger columns;
a missing schema can prevent a new instance becoming ready. This is a possible
deployment failure, not a verified database finding.

Do not remove `timeZone` or disable strict unknown-property validation to hide
the mismatch. Acceptance requires a matching backend version directly and via
Pages, followed by real Google signup/login and account-timezone verification.

The authenticated Render tab remains available for follow-up. No credential was
disconnected and no permissions were expanded during this read-only inspection.

## Authorized remediation — October 18

The user restored GitHub repository access and authorized completing the fix.
Render now lists `farzad-bahadorifar/mehrchain` in its deployment credential.

The live Render `DATABASE_URL` was compared by SHA-256 with the privately saved
production connection; they match. The production schema had only the October 5
release baseline and October 6 daily hearts migration, with matching SQL
checksums, and none of the three new calendar/lifecycle/ledger additions.

Before changes:

- Captured a consistent read-only JSON backup under ignored `docs/backups/`.
- Created Neon recovery branch `timezone-recovery-20261018`
  (`br-dry-voice-b1ubd1pa`) from `production`, with no automatic expiry.
- Verified every original row and field on that branch against the backup.
- Created its child `timezone-rehearsal-20261018` (`br-dry-thunder-b1x7p6r4`),
  expiring October 19 around 23:02 Asia/Tehran.
- Applied all three pending release migrations on the populated rehearsal copy;
  repeated deploy, checked migration checksums and zero schema drift, verified all
  original rows/fields, UTC defaults, daily log keys, unique indexes and cascade
  foreign keys. The original recovery branch was left untouched.
- Ran all backend suites: 15 suites / 124 tests passed, using the same in-memory
  ESM-compatible Jest override noted above.

Applied the same release migrations to production through the release wrapper.
Repeat deployment reports no pending migrations, schema drift is zero and all
original fields remain unchanged. Counts are still users 2, commitments 3, logs 3,
chain connections 0 and invites 1. Existing accounts retain UTC. Verification
evidence without personal data is saved under ignored `tmp/`.

Approved the Render Blueprint sync for revision
`657eab16791289ef9bcc9fecfa013d1fcf53452e`, updating its actual build command to
the fresh release build, health path to `/api/version` and Node version to the
checked-in configuration. This started deployment `dep-dbahv349v7es738jb0tg`.
That first deployment exposed a further release-config defect: `NODE_ENV=production`
caused `npm ci` to omit dev dependencies, so the release script failed with
`prisma: not found`. Fixed the checked-in command to explicitly include development
build tools with `npm ci --include=dev --legacy-peer-deps`, committed and pushed as
`952f5f376b3ee6db0d64791d81e189cb6b0944b6`. Render received this push automatically
and created Blueprint sync `exe-dbahvpm1egvs73dnola0`, confirming repository event
delivery is working again.

## Live verification after remediation

Deployment `dep-dbahvpiog99s739e5tlg` completed successfully and is **Live** on
revision `952f5f376b3ee6db0d64791d81e189cb6b0944b6`. Render reports a 2m38s
deployment. The production schema-readiness check passed during startup.

Confirmed directly on Render and via Pages:

- `/api/version` returns HTTP 200, the expected SHA and
  `authContract: "account-timezone-v1"`; both return the same build timestamp
  `2026-10-18T19:38:49.812Z`.
- Live Swagger schemas for Google and email registration both expose `timeZone`.
- Repeating the original diagnostic request with empty `idToken` and
  `timeZone: "Asia/Tehran"` returns only `Google ID token cannot be empty`.
  The `property timeZone should not exist` error is gone.
- An unrelated `extra` property is still rejected by strict validation.
- A deliberately invalid, nonempty Google token plus `timeZone` reaches token
  verification and returns HTTP 401 rather than the former DTO error.
- Invalid email-signup fields plus `timeZone` produce their expected validation
  errors without rejecting `timeZone`; no new identity or email was used.
- The public OAuth client ID in the live frontend bundle matches Render's
  `GOOGLE_CLIENT_ID` exactly.

Saved sanitized HTTP evidence in ignored `tmp/timezone-live-acceptance.json` and
a screenshot of the successful deployment in
`tmp/render-timezone-deploy-live.jpg`. A real account's interactive Google login
and new-account signup remain for the user to verify; fake-token probes do not
establish successful Google authentication. No real email delivery was tested.
