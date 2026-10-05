# Review of roadmap issues #47–#54

October 5, 2026. All implementation changes are local and uncommitted for owner review. No push, deployment, production schema mutation or tester contact was performed.

## Outcome by issue

| Issue    | Local work                                                                                                                                                                                | Remaining acceptance evidence                                                                             |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| #47 / R1 | Backup-only script, isolated generated release baseline, reviewed additive schema patch, migration/recovery procedure                                                                     | Recovery-backed existing database upgrade, fresh database replay twice, zero drift and recovery rehearsal |
| #48 / R2 | Production Google claim checks/mock rejection, OTP nondisclosure, verified-user OTP bypass fixed, username ownership, crypto randomness, honest mail failure, enabled auth throttle guard | Real provider setup, inbox delivery, valid Google credential and deployed route                           |
| #49 / R3 | Public client ID build input, official Google button, no mock fallback, production demo blocked, session verification, invite return URL                                                  | Cloud Console/Pages/Render configuration and actual-origin browser checks                                 |
| #50 / R4 | Validated public flag, confirmed remote writes, visible retry errors, session-safe replies, transactional Spark/log update with row lock                                                  | Real HTTP/DB concurrency and cross-browser persistence                                                    |
| #51 / R5 | Server code across share/copy/QR, public invite lookup, awaited acceptance, conditional transactional claim, partner completion date, exact reciprocal disconnect                         | Two real accounts on public deployment                                                                    |
| #52 / R6 | Confirmed Heart writes, scoped chain/customization state, account cache cleanup, accepted-user/habit cascade relationships                                                                | Apply FKs, delete a disposable account and inspect all related rows/old-token access                      |
| #53 / R7 | Executable public API smoke and manual instructions below                                                                                                                                 | Deploy, execute with verified disposable accounts, record both browser flows                              |
| #54 / R8 | Two-wave protocol and results template for 5–10 people                                                                                                                                    | Owner conducts test after R7; no human results yet                                                        |

## Database evidence

Read-only inspection of the Neon connection in local `.env` found all six expected tables. Counts: 4 users, 8 commitments, 13 logs, zero connections/invites. Existing ownership FKs cascade. The deployed Render database target has not been independently confirmed in this session. A public route probe through https://mehrchain.pages.dev returned timeouts for GET /api and an intentionally invalid POST /api/auth/google from this environment; this does not prove those routes are absent. Recheck after deployment from the operator browser.

Read-only Prisma diff found exactly three changes: nullable users.name, acceptance-user FK and acceptance-habit FK. The historical baseline record's checksum differs from the SQL file. Consequently the old R1 Done claim was reopened. See [database procedure](database_migration_procedure.md); avoid the legacy initialization scripts and destructive db push.

## Local verification

- Backend Jest: 11 suites, 100 tests passing.
- Frontend Angular/Vitest: 31 files, 148 tests passing.
- Production frontend and backend builds pass; Prisma schema validation and Client generation pass.
- Smoke/migration/backup JavaScript syntax checks pass; release-migration prepare succeeds without DB changes.
- Regression coverage includes mock-token rejection in production, wrong Google claims, arbitrary OTP against verified users, nondisclosure, username ownership, failed email delivery, failed remote habit writes, late replies after account changes and rejection of local production tokens. Existing tests now expect server confirmation rather than immediate optimistic success.

These are local tests with mocked HTTP/Prisma where applicable. The generated baseline has not been executed on a fresh PostgreSQL branch and the public smoke has not been executed. Existing build warnings include Angular decorator metadata and qrcode CommonJS packaging; neither stopped the build.

## Execute #53 after review/deployment

Prerequisites: Node 22, reviewed/migrated backend, production NODE_ENV, real email delivery or Google configuration, two disposable accounts. Create/verify both accounts in the UI first; this tests onboarding and provider delivery. The API smoke intentionally does not bypass OTP or create test identities.

Set privately in the operator shell:

- SMOKE_API_URL: actual public API base ending in /api.
- SMOKE_A_EMAIL / SMOKE_A_PASSWORD: disposable verified account A.
- SMOKE_B_EMAIL / SMOKE_B_PASSWORD: disposable verified account B.
- SMOKE_DELETE_B=yes: only when B is disposable and deleting it is intended. Otherwise deletion is explicitly skipped and R6/R7 remain incomplete.

Run `node scripts/release-smoke.cjs`. It writes temporary habits and a real chain, checks fresh API reads, then attempts cleanup of those habits. With deletion enabled it permanently deletes B and its related data. Failed cleanup produces a nonzero exit; inspect/remove only the smoke records privately. No tokens/passwords/OTP are printed.

The script checks real login, unauthorized reads/edits/reactions, production mock rejection, duplicate Spark requests with one persisted log, login identity stability, public invite lookup, self/repeated acceptance rejection, reciprocal chains, persisted Heart, disconnect or deletion, and partner cleanup. It does not prove browser UX, real Google popup behavior, complete SQL absence of deleted records, or server-unavailable UI handling.

Complete manually on public Pages in two clean browsers:

1. Register/verify, create both a private and a public habit, Spark, logout/login and reload on the second browser.
2. Open an invite while signed out. Verify sign-in returns to that invite. Share/Copy/QR must use the same server code; invalid/expired/used codes show errors.
3. Accept with a saved public habit, reload both sides, send Heart and reload; switch accounts and check habit/chain/Mero isolation.
4. Block the API or disable network during create/edit/Spark/Heart/delete. Show failure, keep input/state, never celebrate a failed write. Retry after reconnecting.
5. Delete disposable B. Verify no user/owned habits/logs/chain rows or sender/acceptance invite references remain with read-only SQL. Old token must return 401. Other users' own habits must remain.
6. Record frontend/backend revision, migration name, timestamp, device/browser, action/status and fresh API/SQL evidence. Only then mark #53 Done and start [field testing](field_test_protocol.md).

## Deadline assessment

The local critical paths are implemented, but real provider setup and deployed verification still control readiness. A 5–10-person test this week remains conditional on completing these gates before inviting participants. Google/email setup steps with concrete acceptance criteria are in the roadmap. Do not label #47–#54 all Done based on these local changes.
