# T12 release execution — October 21, 2026

> This historical record describes the former hosting setup. Production now runs on Deplexo.
> See the [current deployment guide](production_deployment.md).

## Verified production correction

Render's latest failed deployment of `c8d193d89b264d8a7bab30b042a4ef10b49bf57c`
had built successfully, registered the Mero routes, then failed the database
readiness guard. The live revision was still `67ed08d`. The actual Render
database destination was matched privately to the existing production
connection, rather than the unrelated root `.env` database.

Production had the first five release migrations, with neither T05 nor T06.
A fresh private JSON backup includes every public table. The backup script now
discovers tables instead of omitting the heart allowance ledger and later tables.
Backup data and connection strings remain ignored and uncommitted.

Created `t12-recovery-20261021` (`br-curly-star-b1b5lhti`) with no automatic expiry.
Its original rows/fields match the backup. Its disposable child
`t12-rehearsal-20261021` (`br-old-dew-b1xv76qz`, expires October 22 around 21:15
Asia/Tehran) also included synthetic reciprocal links, a heart allowance and
22 canonical consecutive completion dates. Both pending migrations deployed
through `scripts/release-migrate.cjs`; repeat deploy succeeded. Original fields,
generation backfill, Mero milestone/day/partner/support backfill and a participant
deletion cascade were checked on that copy. The recovery branch was not migrated.

The old Render service was temporarily suspended before production migration.
The production preflight still matched every backed-up original row/field.
Applied only `20261019000000_chain_disconnect_receipts` and
`20261020000000_mero_color_collection` through the isolated wrapper. Repeat deploy
succeeded; all seven applied migration checksums match the reviewed files.
Original production rows/fields remain unchanged: users 3, commitments 5,
completion logs 3, invites 2, connections 0, heart allowances 0.

Resumed the service and deployed the latest remote commit. Render deployment
`dep-dbcfm1uktt5c73fadv40` succeeded and is Live on
`c8d193d89b264d8a7bab30b042a4ef10b49bf57c`. Startup passed the current schema guard.
Direct Render and Pages `/api/version` both returned HTTP 200 with that revision,
`builtAt: 2026-10-21T17:49:51.639Z` and `authContract: account-timezone-v1`.
Unauthenticated collection reads both returned HTTP 401, replacing the old missing
route response. This establishes route availability, not authenticated collection
or installed-PWA acceptance. The old live backend explains the earlier 404;
the new backend's startup failure was independently traced to missing schema.

## Remaining acceptance

No local build, unit suite, frontend suite or APK workflow was run in this session.
Render performed its normal remote build as part of the requested operational
deployment. No code was pushed. Private evidence is in ignored
`tmp/t12-*-result.json` and `tmp/t12-evidence/render-live.png`.
Fresh frontend/PWA refresh, authenticated collection behavior, receipt retry/race
acceptance and full populated recovery remain T09 release acceptance. Later T17
schema changes require their own snapshot/rehearsal and matching deployment;
this evidence accepts only the T05/T06 schema and the revision above.
