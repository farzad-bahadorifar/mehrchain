# MehrChain — Next iteration

> Updated: **2026-10-23 (Asia/Tehran)**. Iteration deadline completed.
> **Current Focus:** Post-pilot release stabilization, owner-requested product corrections, and a gated signed Android v1 release.
> **Pilot Feedback:** An initial two-person pilot was conducted and core signup/Chain interactions operated. However, notable friction and gaps were identified: free-tier Render 15-minute spin-down and Cloudflare Pages proxy 524 timeouts, unconfigured Resend credentials on Render for real email verification, and pending production database migrations for T05 and T06.
> **Codebase State:** T00–T08, T10 and T11 have historical committed implementations; T09 is field acceptance. The later October 21 session repaired the T12 production backend/schema gate and prepared local T13/T15/T16/T17 corrections. Local implementation does not establish final release acceptance; T14 delivery, new T17 production schema, current automated/PWA/device checks and Android gates remain open. Historical task commits remain recorded below.
> **Release Blocker Repaired (T10):** Webpack shared-module resolution failure on Render was resolved by adding `baseUrl: "../.."` to `apps/mehrchain-backend/tsconfig.app.json` (committed in `9c981d1`).
> **New Stabilization Tasks Created:** T12 (#68) for pending migration deployment & release verification; T13 (#69) for backend Jest ESM CI fix; T14 (#71) for production Resend email configuration; T15 (#72) for cold-start latency & proxy timeout mitigation.
> **October 21 Owner Additions:** T16's minimal UI/visible Why/direct delete and T17's optional username/password-access corrections are implemented locally. T18's opt-in GitHub release discovery was subsequently implemented in merged PR #73; signing/deployment acceptance remains open. GitHub issues/Project items for these additions remain unsynchronized. The current handoffs distinguish implementation from operational/field acceptance.
> **October 24 Owner Correction:** T19 must fit mobile viewport sizes, keep a centered mobile-width shell in desktop PWA, and prevent mobile page zoom where supported. The owner rejected the Text size feature: remove its toolbar and saved font overrides. Implementation exists; real-device acceptance remains open.
> **October 23 UI/UX discovery:** T20–T25 add design-system/palette review, username diagnosis, Profile redesign, a dedicated Badge page, color-collection redesign and an exploratory Mero belly interaction. These require analysis, wireframes and visible HTML prototypes reviewed by the owner before product implementation. See [discovery brief](ui_ux_discovery_plan.md); no prototype or redesign has been implemented by this roadmap update.
> **Android Evidence (October 21):** [APK workflow run 39544902232](https://github.com/farzad-bahadorifar/mehrchain/actions/runs/39544902232), for `752e199`, failed at backend tests; frontend tests, Capacitor sync, APK build and artifact upload were skipped. The local Android web bundle is dated August 30 (`main-SVIVLEG6.js`), whereas the local web build is dated October 20 (`main-6I3XOFP2.js`). Current native assets are not synchronized with the latest web changes. No fresh APK or native acceptance is claimed.
> **Later October 21 live evidence:** T12 applied only the missing T05/T06 migrations with snapshot/rehearsal and restored matching Render/Pages backend identity on `c8d193d`. The existing APK run on that commit passed backend tests and failed frontend tests before packaging; local frontend-fixture corrections await rerun. T17's additional migration was rehearsed only on a disposable copy. No local suite/build or new code push was performed in this session. See T12–T17 handoffs below.

## Product rules

People should have room to grow through choice, small steps and real support. A solo user gets a complete experience; Chain is optional. Keep progress private, avoid comparison and preserve earlier effort after absence.

- **Daily habits:** Endless or Custom N completed days. A new calendar date opens the next completion; creating a habit at 08:00 must not impose an 08:00 reset.
- **Per-habit streak:** no global streak. After one missed date, the next completion starts at 1; cumulative progress remains.
- **Two missed days:** archive that habit after two fully missed consecutive dates and disconnect its attached chains. Opening the app or completing another habit does not count. Restore preserves history and requires a new invitation to reconnect.
- **Quiet support:** one heart action, received support without names, a number when multiple hearts arrive. No reaction feed or partner streak comparison.
- **Respectful disconnect:** ask a reason, preview what is shared and deliver it privately to the partner. Include a non-disclosing choice.
- **Mero:** fixed name. The current implementation uses adaptive Three.js rendering with animation and static/fallback behavior; the original static-only T01 direction has been superseded in code by `31e965f` and `657eab1`. T06 applies the selected named color to the existing 3D/fallback mascot, with permanent slots and optional habit/accepted-Chain progress paths. Preserve motion/device safeguards and keep names attached to colors.
- **Minimal UI:** one primary action per card, one completion check, secondary information in details. Desktop PWA content stays compact even in a maximized window.
- **Owner correction (October 21; clarified October 22):** remove the recently added expandable rule/help panels and redundant navigation banners/links. Preserve the established onboarding introduction: why walk together, the meaning of MehrChain and how Chains work, including their cards and copy. Keep necessary labels, validation, save errors and confirmation consequences. The optional habit Why input is always visible in habit forms, starts empty and uses a placeholder; it must not be hidden in an optional accordion or populated with sample motivation.
- **Personal motivation:** only a reason deliberately entered by the user qualifies for the pre-deletion reflection and any future motivation reminder. Blank/sample values do not qualify. Habit Why is private and distinct from a Chain disconnect explanation; future Chain behavior must not expose it to partners implicitly.
- **Removal choices:** direct permanent deletion must be available from the active habit on Home without first archiving it. Show the user's custom Why before confirming deletion. Keep cancellation and archive as separate choices; automatic two-missed-day archiving and history-preserving restore remain unchanged.
- **Honest feedback:** confirm saves before showing success; preserve input and allow retry on failure. Use short English copy, accessible controls and restrained feedback.

Implemented in T02/T03: persisted account IANA timezone; no missed-day penalty for a partial creation/restore date; Custom counts completed days; finite goals offer Continue or Archive when reached. Existing accounts/history retain UTC, and signing in or changing device timezone does not change an account's zone. The October 18 migration preserved those historical fields and UTC defaults. On October 20 the owner selected T06 scenario C: first earn a permanent color slot through one 21-day habit streak, then earn more shared slots through completed account dates or distinct accepted Chain partners. The precise contract is recorded under T06 below; this is not a global streak or an obligation to connect.

Implemented in T04: one sender per recipient habit per recipient account date, regardless of multiple links. A send is idempotent and never toggles off on retry. Disconnect/archive/private changes clear visible support, but do not refund that day's allowance; reconnecting the same day cannot revive the old support. Sent state follows the partner habit's calendar; own received counts follow the own habit's calendar. T05 retains this distinction: disconnect receipts do not read or modify the daily allowance ledger.

Implemented in T05 (`ed38dd6`): an explicit manual reason, Cancel, private preview and optional 500-character plain-text explanation; one durable partner receipt in the reciprocal-disconnect transaction; generation tokens for safe reconnect/retry; neutral lifecycle receipts; a recipient-only pending inbox with explicit saved dismissal. Prefer not to share stores no explanation. These are implementation facts from source review, not executed acceptance results.

## Implementation order

`FE` = `apps/mehrchain-frontend/src/app`; `BE` = `apps/mehrchain-backend/src/app`. T00–T15 map to GitHub issues [#55](https://github.com/farzad-bahadorifar/mehrchain/issues/55)–[#72](https://github.com/farzad-bahadorifar/mehrchain/issues/72). T16–T25 are local roadmap tasks with issue/Project synchronization pending. Task IDs are stable references, not execution order; use the release sequence below.

| Task | Issue | Implementation | Commit | Status | Acceptance evidence in repository |
| --- | --- | --- | --- | --- | --- |
| T00 | [#55](https://github.com/farzad-bahadorifar/mehrchain/issues/55) | Complete / pushed | `784d1ed`, release fix `952f5f3` | Done | Production timezone blocker resolved; live API verified |
| T01 | [#56](https://github.com/farzad-bahadorifar/mehrchain/issues/56) | Complete / pushed | `cfaf0fd`; follow-ups `0e0bb54`, `657eab1` | Done | App shell, minimal cards, and Mero adaptive render in place |
| T02 | [#57](https://github.com/farzad-bahadorifar/mehrchain/issues/57) | Complete / pushed | `9643bda` | Done | Backend deployed; account-calendar migration verified on production |
| T03 | [#58](https://github.com/farzad-bahadorifar/mehrchain/issues/58) | Complete / pushed | `2f1cff1` | Done | Backend deployed; 2-day inactivity archive migration verified |
| T04 | [#59](https://github.com/farzad-bahadorifar/mehrchain/issues/59) | Complete / pushed | `9066570` | Done | Idempotent hearts, allowance ledger migration verified on production |
| T05 | [#60](https://github.com/farzad-bahadorifar/mehrchain/issues/60) | Complete / pushed | `ed38dd6` | Field acceptance pending | T12 applied migration; current receipt/retry acceptance remains |
| T06 | [#61](https://github.com/farzad-bahadorifar/mehrchain/issues/61) | Complete / pushed | `ddee9ff` | Field acceptance pending | T12 applied migration and restored route; authenticated/PWA acceptance remains |
| T07 | [#62](https://github.com/farzad-bahadorifar/mehrchain/issues/62) | Historical implementation / pushed | `023b42d` | Needs correction (T16) | Long help panels, return links and collapsed Why superseded by October 21 owner direction |
| T08 | [#63](https://github.com/farzad-bahadorifar/mehrchain/issues/63) | Complete / pushed | `37ba0e3` | In Progress | Foreground refresh deduplication & latency probe script committed |
| T09 | [#64](https://github.com/farzad-bahadorifar/mehrchain/issues/64) | Field acceptance | Pilot executed | In Progress | Two-person pilot completed; multi-day & edge case validation remaining |
| T10 | [#66](https://github.com/farzad-bahadorifar/mehrchain/issues/66) | Complete / pushed | `9c981d1` | Done | Backend tsconfig `baseUrl` repair resolved webpack shared-module error |
| T11 | [#67](https://github.com/farzad-bahadorifar/mehrchain/issues/67) | Complete / pushed | `370a0c2` | Done | Journey tab refactored: Active habits, Best streak, Active Chains, Calendar |
| T12 | [#68](https://github.com/farzad-bahadorifar/mehrchain/issues/68) | Backend/schema deployed | `aa8554b` evidence; live `c8d193d` | Frontend/PWA acceptance pending | Snapshot/rehearsal, both pending migrations, matching direct/proxy identity and collection 401 verified |
| T13 | [#69](https://github.com/farzad-bahadorifar/mehrchain/issues/69) | ESM fix committed; frontend fixtures corrected locally | `c8d193d`, `6400edf` | APK rerun pending | Existing remote backend test step passed; frontend/packaging require current acceptance |
| T14 | [#71](https://github.com/farzad-bahadorifar/mehrchain/issues/71) | Setup handoff | `03b1c1e` | Pending owned sending domain/key | Resend login works; no domain exists and owner has no active domain |
| T15 | [#72](https://github.com/farzad-bahadorifar/mehrchain/issues/72) | Local implementation | `7d4e701` | Phone/PWA/network acceptance pending | Bounded safe-read retry; honest warm/failed-idle/slow-follow-up baseline observations |
| T16 | Pending issue | Local implementation | `932e857` | Phone/PWA acceptance pending | Minimal screens, visible Why, direct delete and short collection retry state |
| T17 | Pending issue | Local implementation and disposable migration rehearsal | See T17 handoff | Production/checks/delivery acceptance pending | Optional unique usernames, identifier login, verified password setup/recovery and session guards |
| T18 | Pending issue | Planned | — | Planned (P1; v1 gate) | GitHub stable-release update notice, opt-in APK update and consistent release/version metadata |
| T19 | Pending issue | Implemented; layout correction in review | — | Device acceptance open (P1) | Fit mobile screens, compact desktop PWA, no Text size UI; verify zoom prevention, forms and scrolling on real devices |
| T20 | Pending issue | Discovery planned | — | P1; owner review before implementation | Design-system audit, palette/Mero color alternatives and switchable HTML component/screen preview |
| T21 | Pending issue | Diagnosis/design planned | — | P1; functional blocker first | Diagnose username availability/save routing and prototype a clear account edit/remove/error flow |
| T22 | Pending issue | Discovery planned | — | P1; depends on T20/T21 | Full Profile architecture/wireframes and clickable compact Profile prototype |
| T23 | Pending issue | Discovery planned | — | P1; coordinates with T22 | Badge summary card leading to a scalable dedicated Badge page prototype |
| T24 | Pending issue | Discovery planned | — | P1; depends on T20/T22 | Redesign 21-day reward and color collection/studio without changing earning rules |
| T25 | Pending issue | Feasibility planned | — | P2; optional exploration | Simple belly color-motion prototype, then optional Three.js spike and performance/fallback decision |

The T00–T08 handoffs and OpenSpec checklists are historical notes. Their uncommitted/not-run wording is superseded only by evidence recorded here: T05's verified push; T06/T07/T08 commits and delivery to failed Render backend builds; successful remote Prisma generation in the inspected T06/T08 logs. No local build/test or successful later release is inferred. These historical files are not edited by T10. The October 18 backend results precede T05–T08 and do not validate their code/schema or prove frontend/provider/race acceptance.

## October 19 T05 implementation and release gate

**Recorded evidence:** commit `ed38dd6d80b5ae60f821d4ddc9d2a59ef3ae1ba6`, `feat(chain): add private disconnect reasons and durable receipts`, exists on local `main` and matched GitHub's `refs/heads/main` during this update. The working tree was clean before this documentation edit. No new commit or push is performed by this update. The remote ref confirms code delivery to GitHub; Render/Pages deployment and database state were not queried.

| Area | Source-reviewed state | Execution boundary |
| --- | --- | --- |
| Prisma schema | New required `chain_connections.generationId`, new `ChainDisconnectReceipt` model and two User relation fields | No current database schema/history inspection or schema validation was run |
| New migration | `20261019000000_chain_disconnect_receipts`: backfill tokens from existing connection IDs; create receipts, unique/index/check constraints and participant cascade FKs | File prepared and pushed; application/rehearsal is not verified |
| Existing data contract | SQL changes no existing timezone, completion, habit-progress, invite or heart-ledger field; User relation additions do not add user-table columns | Actual before/after field preservation still needs a populated-copy rehearsal |
| Timezone repair | `users.timeZone`/UTC default, log `dayKey`/`timeZone`, timezone DTOs, calendar arithmetic and the earlier release migrations are unchanged by T05 | October 18 results remain historical; verify the matching new deployed revision before claiming current runtime success |
| Build path | `render.yaml` still installs dev build tools and invokes `build:backend:release`; that script explicitly generates Prisma Client before a fresh backend build; the Nx backend build also depends on Prisma generation | No T05 build or generated-client result is claimed; generation does not apply SQL migrations |
| Startup | Production readiness adds probes for generationId and receipt columns to the four existing probes | The new backend intentionally fails initialization against a database missing T05 schema; this affects backend availability, including auth, rather than only the Chain screen |
| Client/API compatibility | Disconnect DELETE now needs the reviewed generation and an explicit reason; both checked-in Pages proxies forward DELETE bodies | Old frontend bodyless disconnect fails validation; verify matching frontend/backend and installed-PWA refresh |
| Checks | Reason DTO, Chain/lifecycle, frontend service/card and six-probe readiness regression scenarios are added/updated; source review, formatting and Git whitespace review were performed | No build, typecheck, test suite, Prisma validation/generation, OpenSpec validation, HTTP runtime probe or migration was run for T05 in this chat |

### Required T05 release sequence

The October 18 fix established that build identity, API contract and database readiness must agree. **A push or successful Prisma generation alone does not establish that agreement.** The current Render build/start commands do not run migrations automatically. Automatic delivery was observed on October 18; whether the `ed38dd6` push triggered a deployment, and its outcome, are unknown here. If a new deploy fails readiness or an older revision remains live, inspect the actual revision/log/schema instead of treating the timezone contract as newly broken.

1. Inspect the actual Render deployment revision/status and the privately matched database's applied migration history. From the verified October 18 baseline the expected addition is the single T05 migration; confirm the actual target instead of assuming that baseline is still current. Do not replay the three already-applied October 17/18 migrations or re-resolve the baseline.
2. Take a fresh restorable snapshot of the **current** populated state. Rehearse the full pending release chain through the isolated wrapper on a disposable populated copy, including active reciprocal links and hearts. Compare every original row/field, account zones/UTC defaults, log day keys and heart allowances; inspect generation backfill, receipt constraints, deletion cascades, repeat deploy, drift and recovery. The older zero-connection/zero-heart rehearsal does not cover T05.
3. Coordinate a period with old writers stopped, then apply only the reviewed pending release migration(s) to the verified target through `node scripts/release-migrate.cjs deploy`, following the [database procedure](database_migration_procedure.md) and [T05 handoff](t05_review_handoff.md). The new `generationId` is NOT NULL; its Prisma `uuid()` default is generated by the new client, not a SQL default in this migration. An old backend creating connections can therefore fail after the schema addition; old reconnect/disconnect paths also cannot enforce the new receipt/generation contract. Do not leave old/new writers mixed.
4. Build/deploy the matching T05 backend using the existing release command, retaining `--include=dev` and Prisma generation from the canonical schema. Deploy the matching frontend and refresh installed PWAs. Keep build-time client generation and operator-controlled migration execution separate; changing only schema.prisma does not upgrade production.
5. Record successful startup, all required schema probes and the actual direct Render/Pages `/api/version` revisions. Require the deployed SHA to match the intended release (currently `ed38dd6`, or the recorded reviewed successor), retain `authContract: account-timezone-v1`, and confirm both auth DTOs still accept `timeZone` with strict unknown-field validation. Then record real Google/new/returning-account behavior and T05 receipt/retry acceptance separately.

No blanket runtime-safety claim is made without those outcomes. Do not use `db push`, reset the database, edit previously applied migration SQL, remove the readiness guard or add automatic production migrations to bypass a mismatch. A rollback to old code alone is not a complete plan because old creates omit the required token; rehearse a compatible corrective release or snapshot recovery with writes stopped. Preserve the original timezone recovery branch and take a new snapshot before this release; an older pre-T05 snapshot is not a backup of today's data.

## October 18 release evidence

The detailed investigation and execution record is [timezone incident report](timezone_incident_2026-10-18.md). This is a completed deployment record, not a request to repeat production migrations.

| Evidence | Verified result |
| --- | --- |
| Original failure | Direct Render and Pages Google requests returned HTTP 400, `property timeZone should not exist`; live Google/Register Swagger DTOs omitted the field; `/api/version` returned 404 |
| Running old backend | Render was still on manually deployed October 6 commit `483f6c4`; no deployment of the October 17 timezone changes had run |
| Repository connection | Render's deployment credential did not list `mehrchain`; the owner restored repository access and Render then listed it |
| Build defect found during remediation | `NODE_ENV=production` made the new `npm ci` omit dev build tools, causing `prisma: not found`; fixed with explicit `--include=dev` in `render.yaml`, commit `952f5f3` |
| Working release configuration | `npm ci --include=dev --legacy-peer-deps && NX_DAEMON=false npm run build:backend:release`; Prisma generation, fresh backend build, Node 22, start `node dist/mehrchain-backend/main.js`, health path `/api/version` |
| Automatic delivery | Push `952f5f3` triggered Blueprint sync `exe-dbahvpm1egvs73dnola0` and deployment automatically; GitHub-to-Render delivery was observed working |
| Live backend | `952f5f376b3ee6db0d64791d81e189cb6b0944b6`, deployment `dep-dbahvpiog99s739e5tlg`, status **Deploy succeeded / Live**; startup schema probes passed |
| Direct/proxy agreement | Render and Pages `/api/version` both returned 200 with that SHA, `authContract: account-timezone-v1`, build timestamp `2026-10-18T19:38:49.812Z` |
| Auth contract after release | Both live DTOs expose `timeZone`; empty-token + Tehran requests reject only the token, a nonempty invalid token reaches provider verification and returns 401, unrelated properties remain rejected; invalid email-signup fields no longer cause a timezone-field error |
| Google configuration | Public client ID in the live frontend bundle matches Render's `GOOGLE_CLIENT_ID` |
| Backend checks | Local release build passed; all 15 backend suites / 124 tests passed, including auth contract, calendar/lifecycle, Chain and schema readiness; 8 additional local production-mode HTTP checks passed with DB/mail/JWT/Google-provider boundaries substituted |

**Test-runner limit:** the ordinary Jest run failed to load ESM `@nestjs/passport`. The successful backend run used an in-memory ts-jest override with `allowJs` and that dependency transformed. The checked-in Jest configuration was not changed; standard CI compatibility remains a follow-up. No new frontend test/build result or frontend deployment SHA was recorded in this remediation. The observed live web assets were `main-OQYUTWZK.js` and OAuth-config chunk `chunk-W7ZLYALD.js`; these identify the inspected assets, not full frontend acceptance.

**Email configuration follow-up:** the inspected October 18 Render environment had no `RESEND_API_KEY` / `MAIL_FROM` entries and no linked environment groups. `MailService` raises a production 503 if verification mail cannot be sent. Configure/confirm the actual sending credentials and sender, then test delivery/verification before advertising email signup or reset as a working fallback. The timezone fix and matching Google client IDs do not establish mail readiness.

**Database execution and preservation:** the Render database target was privately matched before any writes. Existing release-baseline/daily-heart migration checksums matched. The following additions were applied in order on a populated copy, then production through `scripts/release-migrate.cjs`:

1. `20261017000000_account_calendar` — UTC defaults, log timezone/day keys and unique habit/day index.
2. `20261017100000_habit_lifecycle` — nullable inactivity anchor preserving original dates/progress.
3. `20261018000000_idempotent_chain_hearts` — allowance ledger, composite primary key, recipient/day index and cascade foreign keys.

Repeat deploy was a no-op, all five applied migration checksums matched and schema diff reported zero drift. Every original row/field was compared before/after and again after deployment/probes. At that verification point there were 2 users, 3 habits, 3 completion logs, 0 Chain connections and 1 invite; existing account zones defaulted to UTC. These are historical verification counts, not a claim about future live totals.

**Recovery evidence and limits:** a consistent private JSON backup was saved under ignored `docs/backups/`. Neon branch `timezone-recovery-20261018` (`br-dry-voice-b1ubd1pa`) retains the original schema/data without auto-expiry, with every original row/field verified. Its separate child `timezone-rehearsal-20261018` (`br-dry-thunder-b1x7p6r4`) was migrated and is scheduled to expire October 19 around 23:02 Asia/Tehran. The recovery branch was not migrated. Actual backend switching/restoration and redeployment against the snapshot were not exercised. The copy had habits/logs but **no Chain connections/hearts**: nonempty-heart backfill, duplicate-support fixtures and PostgreSQL send races still require separate rehearsal. Private backups/credentials must stay outside version control; ignored `tmp/` evidence is supplemental, not durable release documentation.

### T00 — Restore signup by aligning the deployed timezone contract ([#55](https://github.com/farzad-bahadorifar/mehrchain/issues/55))

**Priority:** original P0 timezone/API blocker resolved. Complete real-account authentication acceptance before inviting new testers.

**Status:** implementation complete in `784d1ed`, with production remediation and build-tool fix `952f5f3` deployed on October 18. The exact reported validation failure is fixed on direct/proxied production requests. See the [T00 handoff](t00_review_handoff.md) for historical implementation and the [incident report](timezone_incident_2026-10-18.md) for later execution. End-to-end Google/OTP/PWA acceptance is still separate.

- [x] Retain the supported timezone DTOs and strict unknown-field validation; add focused HTTP regression coverage for email/Google timezone persistence, UTC fallback, invalid zones and existing accounts.
- [x] Add a fresh Prisma/backend release build, embedded artifact revision/timestamp, uncached `/api/version` and production schema readiness checks.
- [x] Update the isolated release-migration wrapper and document database/release verification.

**Release verification completed October 18:**

**Scope:** email registration and Google authentication, their request DTOs, Cloudflare Pages `/api/*` proxy, Render backend build/revision and the account-calendar database migration introduced by T02.

The October 17 investigation could not verify production. October 18 live HTTP and authenticated Render checks established that production itself was still on the old October 6 contract. Both Google buttons use the same `/api/auth/google` route, explaining identical signup/sign-in errors. Missing repository visibility prevented automatic updates from reaching this deployment; after access was restored, a separate omitted-dev-tools build defect was found and fixed. The build still intentionally does not apply migrations automatically.

- [x] Reproduce direct/proxied failure and inspect Render's actual deployed SHA, history, build/start settings and GitHub repository visibility.
- [x] Match the production database, verify migration history/checksums, back up, rehearse and apply the complete three-migration chain required by current code; verify preservation, repeat deploy and zero drift.
- [x] Restore repository visibility, synchronize Blueprint settings and fix omitted build tools with `--include=dev`. Observe successful fresh build, startup probes and Live deployment, including automatic delivery of the corrective push.
- [x] Run auth-contract/readiness suites and local production-mode HTTP checks. Local substituted-dependency coverage confirms Tehran persistence, UTC omission fallback, invalid types/IANA values, unrelated-field rejection and existing-account timezone preservation.
- [x] Verify matching direct/Pages build identities, supported live DTOs, accepted timezone field and rejection of invalid tokens/unrelated properties. Retain strict validation; no timezone-dropping workaround was used.

**Remaining acceptance:**

- [ ] Use a real Google identity to create a new account through Pages; verify `/auth/me` persists its detected account timezone. Then sign in again from another device/timezone and verify the stored zone remains unchanged. Record returning legacy UTC-account login separately.
- [ ] Configure/confirm production verification-mail credentials and sender, then verify real email signup, OTP delivery, verification and profile retrieval. Invalid-body API probes do not test mail or a successful registration; record delivery failures separately from the resolved timezone validation issue.
- [ ] Repeat Google signup/login and invite-led entry after an installed PWA update, recording frontend/backend revisions and checking stable identity, saved input and existing data.

**Acceptance boundary:** timezone-field rejection, stale backend and missing-schema release prerequisites are resolved and verified. Successful interactive Google login, new-account persistence and actual OTP/PWA flows still need their own recorded outcomes. T02's daily-boundary checks remain separate. Investigate any new authentication failure by its actual response rather than repeating already-applied migrations.

### T01 — Simplify the interface and desktop PWA ([#56](https://github.com/farzad-bahadorifar/mehrchain/issues/56))

**Status:** implementation complete in `cfaf0fd`; mobile onboarding bottom alignment, input-outline and mascot follow-ups are in `0e0bb54` / `657eab1`. Full visual/runtime acceptance remains unrecorded. See [T01 handoff](t01_review_handoff.md); its static-only mascot direction predates the current Three.js integration.

**Scope:** `FE/app.html/.css`, global styles, dashboard, commitment-card, shared Mero, profile and onboarding copy.

- [x] Introduce one centered responsive app shell. Start visual review around 480–560 CSS px on desktop; fill available width on mobile. Align bottom navigation, floating add button, banners and dialogs with it. Keep scrolling, short windows, keyboard visibility and safe areas usable.
- [x] Remove the dashboard-wide streak. Habit summary keeps title, own streak, daily action and quiet finite progress. Move category, why, reminders and sharing details to accessible details/menu. Remove misleading modulo week dots and the Endless 100% progress bar.
- [x] Show one check with “Completed”. Remove Spark pulse/spin and artificial 400ms delay; pending/disabled state follows the actual request, with retry on failure.
- [x] Complete the original Mero/profile cleanup and preserve existing named-color data for T06. Later Three.js integration (`31e965f`) and appearance/animation restoration (`657eab1`) supersede the original static-only criterion; validate the current component and its fallbacks rather than redoing T01 to remove it.
- [x] Correct obsolete “7, 14, or 21 days” onboarding copy to Endless/Custom. Remove pressure-oriented signup/login wording. Do not advertise new archive/day rules before they ship.

**Acceptance:** all main routes work at 320/390 px and wide desktop sizes, including a maximized installed PWA, short windows, keyboard-open onboarding, dialogs, both themes and intentional desktop browser zoom. No stretched cards, detached controls or clipped actions. Verify the shipped Mero's reduced-motion/static/constrained-device/WebGL fallback behavior. Slow/failed completion never appears successful.

**Original cause addressed:** the manifest already used `standalone`; T01 added the missing shared width-limited route wrapper and aligned navigation with it. Content containment is under app control; native first-launch window size depends on browser/OS. Preserve normal resize/maximize controls.

### T02 — Make daily completion and streak correct ([#57](https://github.com/farzad-bahadorifar/mehrchain/issues/57))

**Status:** implementation complete in `9643bda` and included in live backend `952f5f3`. Calendar migration, original-field preservation, UTC defaults, log day keys and unique index were verified on rehearsal and production on October 18; backend suites passed. Daily-boundary/device/PWA and real PostgreSQL concurrency acceptance remains. See [T02 handoff](t02_review_handoff.md).

**Scope:** `BE/commitments/`, account timezone, Prisma/shared types, frontend commitment store and resume/day-boundary refresh. Uses the implemented calendar rules above.

- [x] Use one server-authoritative local-day calculation for completion, streak and missed full dates. Return current day/next boundary; derive streak on reads as well as completion.
- [x] Preserve same-day idempotency and transaction locking; enforce one persisted completion per habit day. Rehearse/apply the additive UTC-history migration and verify preservation, UTC defaults, day keys, unique index, repeat deploy and zero drift.
- [x] Refresh after local midnight, foreground return and reconnect. A PWA left open overnight must unlock the next opportunity without reload. Device-clock changes cannot grant an extra completion.
- [x] Keep cumulative progress separate from streak. Custom targets stop at their goal and offer Continue or Archive; Endless has no artificial end.

**Acceptance:** 08:00 → next 00:01 is valid; two devices/retries create one daily event; a one-day gap restarts at 1. Test Tehran, DST, year boundary, stale cache and explicit timezone-change policy. Failed refresh remains visibly stale.

### T03 — Archive habits and disconnect chains consistently ([#58](https://github.com/farzad-bahadorifar/mehrchain/issues/58))

**Scope:** commitment archive/restore, `BE/chain/`, relationship/invite data and archive UI. Depends on T02.

**Status:** implementation complete in `2f1cff1` and included in live backend `952f5f3`. Lifecycle migration was rehearsed/applied with original history/progress preserved; backend lifecycle suites passed. Real multi-account archive/restore/reconnect, sleeping-server/PWA and PostgreSQL race acceptance remains. See [T03 handoff](t03_review_handoff.md) and the historical [OpenSpec checklist](../openspec/changes/update-habit-chain-lifecycle/tasks.md).

- [x] After two full missed dates, archive only the affected habit, preserving history/progress. Reconcile on reads/actions even if the server slept; cron is not required for correctness.
- [x] Atomically disconnect its attached reciprocal chains and invalidate outstanding invites. Apply the same lifecycle operation to manual archive; preserve unrelated habits and relationships.
- [x] Revalidate both habits during invite acceptance. Archived/private habits and stale links cannot create connections or receive support. Replace the old three-day DORMANT behavior with the agreed two-day rule.
- [x] Restore with a fresh inactivity anchor and restarted current streak. Require explicit new acceptance to reconnect; existing unique rows must not block legitimate re-invitation. Completed finite goals must not inactivity-archive while awaiting the user's choice.

**Acceptance:** Monday complete, Tuesday/Wednesday missed → archived Thursday 00:00, including after server sleep. One missed date stays active. Multi-partner archive, simultaneous completion/invite, manual archive and restore/reconnect preserve unrelated data and do not immediately rearchive.

### T04 — Make Chain and hearts quiet and minimal ([#59](https://github.com/farzad-bahadorifar/mehrchain/issues/59))

**Scope:** backend reactions, shared response types, frontend Chain service/cards and habit support summary. Depends on T02/T03.

**Status: Done (Closed [#59](https://github.com/farzad-bahadorifar/mehrchain/issues/59)).** Implementation complete and pushed in `9066570`. Backend changes are included in Live `952f5f3`; the allowance-ledger migration `20261018000000_idempotent_chain_hearts` was rehearsed/applied and backend Chain tests passed. Idempotent heart sending, anonymous counts, and deduplicated in-flight requests are verified. Integration multi-account acceptance is tracked under T09.

- [x] Replace the retry-sensitive heart toggle with an idempotent send. Enforce one sender/recipient-habit/recipient-day allowance across links and return the viewer's own aggregate received count plus sent state.
- [x] Replace named support paragraphs/toasts with a heart; show a numeral only above one, with an accessible count description. Daily expiry follows the recipient habit's day.
- [x] Keep Chain cards to partner/habit identification, one restrained current state, heart action and secondary menu. Remove redundant status text, alarm-like pulses, obsolete nudges and Coming Soon clutter.
- [x] Keep invitations easy to find, details/disconnect reachable, and active relationships separate from history. Never expose partner streaks or rank popularity.
- [x] Keep confirmed-save behavior: deduplicate in-flight sends to the same target, expose retryable inline errors and reject stale/session-mismatched responses. Expire cached received/sent state using server boundaries; refresh on foreground/reconnect and pause hidden-page polling.
- [x] Add/backfill `chain_hearts` in the release migration and extend production schema readiness. Verify the migrated ledger's unique key, index and cascade FKs, migration checksums and zero drift.

### T05 — Ask and deliver a disconnect reason ([#60](https://github.com/farzad-bahadorifar/mehrchain/issues/60))

**Scope:** disconnect API/transaction, durable recipient event and compact frontend reason/receipt UI. Depends on T03; integrates with T04's menu.

**Status: In Progress ([#60](https://github.com/farzad-bahadorifar/mehrchain/issues/60)).** Implementation complete and pushed as `ed38dd6` on October 19. Migration `20261019000000_chain_disconnect_receipts` prepared. Subsequent Render deploy failed due to shared-module resolution (fixed in T10); database migration and production release verification are pending under T12. Reuses T03's ordered locking/detach operation and T04's existing disconnect menu. See [T05 handoff](t05_review_handoff.md).

- [x] Ask for a reason with Cancel and a recipient-visible preview. Offer simple choices including “Prefer not to share”; personal explanation is optional.
- [x] Persist one private reason event atomically with reciprocal disconnection. It remains available after the relationship disappears from active queries and after the recipient returns offline.
- [x] Restrict access to the intended participants; safely render any bounded optional text. Retried requests create one event. Automatic archive uses a neutral system reason.
- [x] Preserve T04 behavior when clearing visible support: do not delete/refund the allowance ledger, revive old hearts on reconnect or expose supporter identities through the reason event. Capture the intended receipt before the relationship disappears from active queries.
- [x] Add the required connection generation token; initialize existing rows from their IDs and replace the token on every explicit acceptance. Reject an old-generation disconnect after row reuse, while retries on an already disconnected generation create no new manual receipt.
- [x] Bound optional explanations to 500 characters, trim saved text, render with Angular interpolation and force null text for Prefer not to share. Capture only partner identification and the recipient's own habit title, without private partner habit/support details.
- [x] Capture neutral system receipts for active directions detached by automatic/manual archive, private edits and permanent habit deletion. Leave already disconnected historical rows without invented reasons; retain receipts independently of habit/connection deletion or reuse.
- [x] Add a recipient-only pending inbox (oldest 50), explicit idempotent saved dismissal and refresh of the next batch. Ordinary visits do not dismiss receipts. Guard stale/session-changing responses and preserve retryable input; do not store personal explanations in localStorage.
- [x] Cascade receipt deletion when either participant account is deleted. Add the release migration and two readiness probes; update focused backend/frontend/DTO/readiness regression source scenarios and the release/review documentation.

**Owner validation still required:**

- [ ] Complete and record the October 19 schema/client/backend/frontend release gate; a GitHub push is not migration/deployment evidence. Preserve the timezone contract and the October 18 dev-build-tools fix.
- [ ] Run owner-selected backend/frontend build, typecheck and regression checks after Prisma generation; run OpenSpec validation. Recheck standard Jest compatibility separately from the earlier override-based run.
- [ ] With two real accounts, cancel without writes; confirm one manual reason receipt and reciprocal removal; retry a lost response; return offline with no active chains; explicitly dismiss and verify the saved state on another session/device. Test more than 50 pending receipts.
- [ ] Exercise actual PostgreSQL races: same/opposite-side disconnect, heart, archive/private/hard delete and fresh reacceptance. Verify atomic rollback on receipt failure, no duplicate event and stale-generation rejection without losing unrelated links.
- [ ] Verify neutral automatic reasons, no-disclosure text suppression, literal HTML-like notes, the 500-character boundary, third-account isolation and deletion of either participant. Inspect surviving recipient-day allowances after same-day reconnection and remaining own-habit heart aggregates.
- [ ] Review keyboard focus/Cancel/Escape, mobile/desktop/both themes/PWA, polling while drafting, slow/failing saves, stale reads and account switches. Show success only after confirmation and keep actionable retry errors.

**Acceptance:** cancel changes nothing; manual disconnect updates both sides and the partner receives the chosen reason once. Verify offline return, retries, multiple relationships and account deletion. No chat, email or push infrastructure is needed.

**October 21 motivation follow-up:** the habit's personal Why and this task's disconnect reason are different data and behaviors. The owner will explain the absence/at-risk-Chain notification business rules during the T05 follow-up. T16 preserves a usable custom Why now. Before scheduling reminder implementation, define the exact account-day trigger (including one miss/approaching a second miss), delivery channel, deduplication, consent/privacy, Chain behavior and no-Why alternative. Do not infer those rules from the existing two-missed-day archive rule or claim that T05 already implements them. The v1 baseline below includes Why capture and deletion reflection; this new reminder engine remains unscheduled pending that definition.

### T06 — Permanent named-color collection with two progress paths ([#61](https://github.com/farzad-bahadorifar/mehrchain/issues/61))

**Scope:** compact profile/Mero collection, server-owned milestone/progress/preferences, completion and accepted-Chain integration, historical backfill and additive release migration. Depends on T02/T03/T04/T05.

**Status: In Progress ([#61](https://github.com/farzad-bahadorifar/mehrchain/issues/61)).** Scenario C implemented October 20 in `ddee9ff`. Additive release migration `20261020000000_mero_color_collection` prepared. Render deploy will be verified in clean release following T10 fix; database migration is tracked under T12. See historical [T06 handoff](t06_review_handoff.md).

**October 21 screenshot defect:** Profile shows `Cannot GET /api/mero/collection?ngsw-bypass=true`. T12 must establish the actual deployed revision/schema; T16 must compare direct/proxied routing and fix the collection UI's raw-error presentation. A missing route must not be diagnosed as a database migration failure without evidence. Preserve the collection and its earned capacity contract below.

**Product contract (implementation baseline):**

1. **First slot:** one habit reaches 21 consecutive completed account dates. Never add shorter streaks across habits or count app visits. Chain activity cannot bypass this first milestone. The milestone and every earned slot are permanent, including after a miss, archive, disconnection or habit deletion. Mero's name stays fixed; names belong to colors. The 21-day number is a product milestone, not a habit-formation claim.
2. **Habit path after unlocking:** each later account calendar date with at least one real completion adds one collection day, at most once per account/date across all habits. The unlocking date itself is excluded. Every 21 collection days earns the next slot; gaps pause progress without resetting it. This cumulative collection counter is separate from each habit's current streak and completed-day target. It introduces no global streak, catch-up debt or changes to finite-goal/restore rules.
3. **Optional Chain path:** the first distinct accepted partner reaches the second-slot target; three partners reach the third; five reach the fourth, then seven, etc. Count accepted relationships for both participants, never invites, public habits, hearts received or partner activity. Multiple habits, reconnects, retries and reciprocal rows with the same account count once. Historical real accepted relationships may contribute, including before day 21, but slots remain gated by the first milestone. New account identities cannot be proven to represent different humans; do not promise anti-Sybil protection or add invasive verification.
4. **Shared targets, not additive rewards:** capacity is zero before the milestone; afterwards it is `1 + max(floor(collectionDays / 21), ceil(distinctAcceptedPartners / 2))`. Both paths fill the same slot ladder. Meeting both second-slot targets still yields two total slots, not three. Example: 21 collection days OR one accepted partner gives capacity 2; 42 collection days OR three partners gives capacity 3. Show only the next target for each path. Social participation stays optional and no partner ranking/count is exposed publicly.
5. **Collection behavior:** the default glow is always available outside the collection. Each earned slot can store one validated six-digit hex color and a trimmed 1–30-character plain-text name. One saved color is active at a time; selecting the default, editing/replacing a slot and switching saved colors are free. Slots are permanent capacity, not consumable tokens or scarce hex values. No expiry, forced claim deadline, paid repair, exponential thresholds or deletion-based refund. Show empty earned slots without auto-creating invented colors.
6. **Persistence and isolation:** milestone, collection days, partner deduplication, capacity, saved colors and active selection belong to the authenticated account and survive device changes. Completion/acceptance rewards are written atomically with their source actions and deduplicated under concurrent requests. Later deletion/disconnection does not subtract earned counters. Deleting an account cascades its collection and private progress records; another participant's earned counter remains intact. Failed saves preserve the confirmed appearance and editable draft. Late responses from an old account/session cannot apply to a new one.
7. **Existing data:** backfill eligibility only from reliable server completion dates for one habit, and backfill distinct partners from real persisted connection records, including disconnected rows. Derive later collection dates from distinct account dates after the first qualifying date, not summed habit totals. Do not fabricate deleted history or infer connections from unaccepted invites. Import only valid account-scoped legacy local preferences, after server eligibility, without overwriting an already initialized server collection; locked local candidates remain available for a later retry. Never import local eligibility or ambiguously owned unscoped guest data.
8. **Presentation and release:** keep the collection compact, private and accessible; preserve the shipped Three.js Mero, animation/reduced-motion behavior and fallback, applying the confirmed color consistently. Never let custom colors reduce control/text contrast. Badge claims must use actual accepted connection/sent-support evidence. Prepare a new additive isolated release migration and readiness checks, with backup, populated-copy rehearsal, client generation and compatible rollout documented; do not execute a migration or deploy as part of this task.

- [x] Record the owner-selected scenario C and precise counting, permanence, shared-target and migration rules before implementation.
- [x] Implement durable server progress, historical backfill, account isolation and authenticated collection APIs.
- [x] Integrate atomic/idempotent completion and accepted-Chain progress without changing lifecycle/support contracts.
- [x] Implement confirmed collection saves, safe legacy import, compact next-target UI and actual-event badge eligibility.
- [x] Apply saved colors consistently to Three.js and fallback Mero; prepare focused regression scenarios and review/release handoff.
- [ ] Owner review and selected builds/tests, Prisma client generation, OpenSpec validation, populated-copy migration rehearsal/execution and matching deployment/acceptance. None was run in the implementation session.

**Acceptance (owner-run):** day 20 stays locked and a qualifying day 21 opens slot 1; two short streaks cannot substitute. After unlocking, multiple habit completions on one date add one collection day, gaps retain progress, and the unlock date adds none. The first/third distinct partner reaches capacity 2/3; reconnecting or another habit with the same partner does not advance it. Both routes reaching the same target never duplicate capacity. Existing colors, capacity and counters survive archive/disconnect/habit deletion and device change. Invalid/cross-account requests, concurrent source events, failed saves and stale session replies cannot corrupt state. Verify historical backfill, locked/imported preferences and account-deletion cascades separately. No runtime acceptance is claimed by source implementation alone.

### T07 — Explain daily rules and make returning easy ([#62](https://github.com/farzad-bahadorifar/mehrchain/issues/62))

**Scope:** contextual copy, create/edit habit, Journey/history, archive and return states. Integrates T02–T06.

**Status: In Progress ([#62](https://github.com/farzad-bahadorifar/mehrchain/issues/62)).** Implemented October 20 in `023b42d`. Contextual copy, single missed day step, and account calendar history implemented. Awaiting owner visual/PWA acceptance. See historical [T07 handoff](t07_review_handoff.md). No new API, schema, dependency or migration. Existing T02–T06 lifecycle, heart allowance, private reason/receipt and collection contracts are retained.

**Superseded product direction (October 21):** the checked items below record what shipped in `023b42d`, not the newly accepted UI contract. The owner rejects the long help/explanation sections, redundant archive/collection navigation links and collapsed Why input. T16 removes those surfaces and restores a visible optional reason and direct delete. Preserve calendar/history correctness, guarded invite continuation and archive/restore behavior. T07 cannot pass final acceptance until T16 is accepted.

- [x] Shared daily-rule help in onboarding, new/edit habit and invite quick-create, with collapsed help on Dashboard/Journey: account timezone midnight, once per date, Endless/Custom completed-day goals, partial-date exemption and two-missed-date archive/disconnect. Contextual one-miss, archived-return, anonymous-heart and unfilled earned-slot guidance adds no overlay or repeated onboarding.
- [x] One missed date keeps Complete today as the action, explaining streak 1 and preserved cumulative effort. Dashboard links to Journey's open archive list; explicit Restore confirms preservation and links to today's step. Restore/reconnect and finite-goal behavior remain server-owned, without automatic revival or catch-up debt.
- [x] Journey includes active/archived habits once, uses confirmed cumulative completed-day totals (as Profile does), labels the best current per-habit streak, and normalizes actual history dates separately. Saved day keys remain intact; legacy zoned timestamps use the account zone, legacy date-only strings retain their date, and invalid/ambiguous unzoned values do not invent calendar entries. Calendar today/month use the server account date; grid arithmetic ignores device DST. Same-named habits keep distinct recent entries. Earned colors link to the permanent collection.
- [x] Retain the existing guarded return URL through signup, verification and both login paths; expose invite continuation and restrict it to an internal Chain invite, with explicit acceptance after authentication. Solo completeness and optional Chain are explained; private motivation is collapsed/optional with no invented default reason. Old nudge copy now matches quiet-heart behavior. T05 disconnect preview/private receipt UI remains intact.
- [ ] Owner-selected builds/tests/typecheck/OpenSpec validation, real signup/login/provider/invite, midnight/cross-device, visual/PWA and new/daily/one-miss/weeks-away acceptance.

**Acceptance:** a new user, daily visitor, user after one miss and user returning after weeks can identify the next action unaided. Dates/history agree across views and devices. No new coaching system, extra daily ritual or celebration overlay is required.

### T08 — Reduce startup and access friction within a free budget ([#63](https://github.com/farzad-bahadorifar/mehrchain/issues/63))

**Scope:** current Pages proxy, Render/Neon request path, authentication reachability, loading/retry and foreground refresh.

**Status: In Progress ([#63](https://github.com/farzad-bahadorifar/mehrchain/issues/63)).** Access-recovery implementation/tooling committed in `37ba0e3`. Measurements tool `scripts/measure-access-latency.cjs` prepared. Pilot test confirmed Render 15-min idle spin-down and Cloudflare Pages proxy 524 timeouts are the primary source of user-perceived delay. Latency measurements will proceed once T12 release is live.

**Already completed elsewhere:** the timezone-contract/release failure is resolved under T00. T04 pauses hidden Chain polling, deduplicates target heart sends and guards stale/session responses. Retain them and test the remaining refresh/request path.

- [ ] Measure warm and idle first-action latency separately for API, database and auth provider, on representative desktop/mobile networks and with/without proxy where feasible. Keep private account data out of measurements.
- [x] Pause hidden Chain polling and add T04's target-send/session guards; keep these completed changes when improving access behavior.
- [x] Implement shared foreground event bursts and per-session pending habit/Chain/inbox/Mero reads, with one deferred collection refresh for habit changes during a read/save. Automatic hidden/offline reads defer; expired calendar/support stays stale. Retain target-send and stale-session guards.
- [x] Bound/track API waits, including auth/inbox; add explicit deduplicated persisted-session retry and start habit loading after confirmed auth without blocking navigation. Preserve drafts, server-confirmed success and explicit write retries. Neutral waiting notice dismisses without altering request accounting.
- [x] Prepare bounded anonymous direct/proxy/API, Google-script and explicit read-only database probes plus independent idle/warm desktop/mobile protocol.
- [x] Review official Render/Neon/Workers limits (October 20) and record **provisional keep** for Pages/Render/Neon. No representative measurement justifies migration; account usage and compatibility remain unmeasured.
- [ ] Execute/verify foreground deduplication, read/save/account-switch races, hidden/offline return, drafts, session recovery and installed-PWA behavior; record measured first-action improvement separately from implementation.
- [ ] Only if startup remains a material blocker, run a bounded Workers + existing database experiment with representative auth, hashing and transactional writes. Compare free quotas, compatibility, actual latency and maintenance cost.
- [ ] Finalize keep/migrate acceptance from representative latency evidence.

**Acceptance:** identify the real delay and show a measured improvement or a clear reason to keep the current stack. A new host must preserve auth, transactions and data recovery; no promise of zero warm-up from a hello-world test.

### T09 — Verify the complete experience with two real accounts ([#64](https://github.com/farzad-bahadorifar/mehrchain/issues/64))

**Scope:** focused regression/integration tests, deployed browser/PWA acceptance and pilot acceptance.

**Status: In Progress ([#64](https://github.com/farzad-bahadorifar/mehrchain/issues/64)).** An initial two-person pilot was conducted. Basic signup and Chain interactions succeeded, confirming the core architecture works. However, multiple release/operational gaps were identified: pending DB migrations (T05/T06), missing Resend email credentials on Render (T14), cold-start proxy timeouts (T15), and backend CI test suite ESM compatibility (T13). The iteration deadline has ended; work now focuses on release stabilization and multi-day field verification.

**Evidence already available:** the October 18 record contains 124 backend tests, production-mode substituted-dependency auth checks, real migration/preservation/schema checks, observed automatic deployment and live direct/proxied contract probes. These results predate T05 and do not validate `ed38dd6`, its migration or its new scenarios. T05 has source/format/whitespace review and a verified remote commit only; no new executed test count, production schema state or deployment identity is recorded. Frontend tests, real-provider success and multi-account UI/races still need separate evidence.

- [ ] Make the checked-in backend Jest/CI command handle ESM `@nestjs/passport` (or otherwise resolve the compatibility issue), then record an unmodified standard-command result. Do not report the temporary override as a passing CI run. Record frontend test/build and OpenSpec results separately.
- [ ] Verify real signup/login, stable identity, sign-out/in, reload, invite-led signup, solo/public habits and reciprocal Chain acceptance using two independent browser sessions.
- [ ] Cover midnight, one miss, two misses, long absence, restore/reconnect, finite goal, day 21, multiple hearts and reason delivery. Use a controlled clock for arithmetic and real PostgreSQL for transaction/race checks; distinguish simulated dates from observed days.
- [ ] Verify slow/unavailable API, retry, expired session and account switch. Check deletion with disposable accounts, old-token denial and preservation of the other user's data. Confirm an updated PWA receives the new UI without losing in-flight work.
- [ ] Accept T16–T19 on the reviewed release revision: minimal screens, custom/blank Why and direct deletion; username add/edit/remove, concurrent claims and both login identifiers; stable-release update notice, dismissal/retry and no notification for the same/older/preview version; mobile web/PWA zoom triggers, responsive fit/keyboard/scrolling, compact desktop PWA and documented browser exceptions.
- [ ] Install the freshly synchronized signed APK on a real Android phone. Verify real Google signup/login, email/username login, invite return, completion, Chain/heart, Profile collection and deletion. If WebView Google auth fails, repair that flow before declaring the Android release accepted; a successful PWA provider flow is separate evidence. Verify an APK upgrade with the same app ID/signing certificate and a higher versionCode preserves account/session and habit data.
- [ ] Record tested frontend/backend revisions, migration names, commands, outcomes and defects in a durable acceptance record; link sanitized evidence. Keep secrets, tokens, account dumps and private backups out of version control. Use the existing [test handoff](v1_test_and_release_handoff.md) and [database procedure](database_migration_procedure.md) for relevant setup/recovery.
- [ ] Exercise recovery on a disposable populated branch, including connecting the previous compatible backend and verifying data after switching/restoration. The retained recovery snapshot and successful copy comparison are prerequisites, not a completed failover/rollback drill. Agree retention/cleanup of recovery branches after acceptance; do not discard the recovery branch merely because the temporary rehearsal expires.

**Acceptance:** the core journey and requested return/support rules work in the intended environment; desktop installed PWA and mobile layouts pass. Untested paths stay explicit. A successful build or unit count alone does not prove acceptance.

### T10 — Repair backend shared-module resolution ([#66](https://github.com/farzad-bahadorifar/mehrchain/issues/66))

**Priority:** P0 release blocker.  
**Commit:** `9c981d1` (fix(ui): prevent Mero loading flicker and simplify tab headers)  
**Status: Done (Closed [#66](https://github.com/farzad-bahadorifar/mehrchain/issues/66)).**

Scope: restore runtime imports from the existing shared TypeScript source in the backend production bundle. Render T06/T08 logs showed Prisma Client generation succeeding, then webpack failing to resolve `@mehrchain/shared-data` in `chain/dto/disconnect-chain.dto.ts` and `mero/mero.service.ts`.

- [x] Register the blocker and P0 precedence; record exact failed revisions/logs and the live revision without changing production.
- [x] Added `baseUrl: "../.."` to `apps/mehrchain-backend/tsconfig.app.json` so `tsconfig-paths-webpack-plugin` anchors inherited paths at the workspace root and resolves `@mehrchain/shared-data` to `libs/shared-data/src/index.ts`.
- [x] Code committed and pushed in `9c981d1`. Clean release build and deployment will be executed as part of T12 release gate.

### T11 — Refocus Journey on progress, history and optional support ([#67](https://github.com/farzad-bahadorifar/mehrchain/issues/67))

**Priority:** P1  
**Commit:** `370a0c2` (feat(journey): refine progress overview and calendar history)  
**Status: Done (Closed [#67](https://github.com/farzad-bahadorifar/mehrchain/issues/67)).**

Implementation follows the recommended **Active habits / Best current streak / Active Chains** direction, with received hearts as optional secondary support. Replaced ambiguous Sparks with clear progress metrics, relocated cumulative completions to the calendar header, made the Activity calendar the central history view with date-filtered completions, and placed collapsed archived habits with explicit Restore at the bottom.

- [x] Replaced Sparks with Active habits, Best current streak, and Active Chains summary cards.
- [x] Date-linked Activity calendar as main history; selecting a date filters historical entries with instant "Back to recent".
- [x] Preserved account timezone day keys, cumulative completions across habits, and collapsed archive restore.
- [x] Preserved quiet anonymous hearts ("Support today") without turning support into a social popularity contest.
- [x] Updated skeleton and regression tests; committed in `370a0c2`.

### T12 — Production Release: Deploy pending migrations & verify live Render backend ([#68](https://github.com/farzad-bahadorifar/mehrchain/issues/68))

**Priority:** P0 (Release Gate)  
**Status: Backend/database release repaired; frontend/PWA acceptance pending ([#68](https://github.com/farzad-bahadorifar/mehrchain/issues/68)).** Depends on T10. See [October 21 execution evidence](t12_release_execution_2026-10-21.md).

**Scope:** Apply pending database migrations and verify fresh Render backend deployment.
- [x] Inspect current applied migrations on production Neon DB.
- [x] Take a restorable snapshot before executing migrations.
- [x] Apply `20261019000000_chain_disconnect_receipts` (T05) via `scripts/release-migrate.cjs deploy`.
- [x] Apply `20261020000000_mero_color_collection` (T06) via `scripts/release-migrate.cjs deploy`.
- [x] Verify Render backend deployment succeeds with the T10 fix and starts cleanly.
- [ ] Verify direct Render and Pages `/api/version` return 200 with the matching intended release commit SHA and all required schema readiness probes pass (10 in the current source; include any added by later tasks). Deploy/refresh the matching frontend too.
- [x] Compare direct/proxied collection route behavior: the old live revision lacked the route; the new deployment failed readiness against missing schema. After migration/deployment, both routes return 401 without authentication. Authenticated collection/PWA acceptance remains pending.

### T13 — Fix backend CI test suite ESM compatibility (@nestjs/passport) ([#69](https://github.com/farzad-bahadorifar/mehrchain/issues/69))

**Priority:** P1  
**Status: Backend ESM correction has remote CI evidence; local frontend fixture fixes await rerun ([#69](https://github.com/farzad-bahadorifar/mehrchain/issues/69)).**

**October 21 remote evidence:** the existing APK run [39645196942](https://github.com/farzad-bahadorifar/mehrchain/actions/runs/39645196942) on `c8d193d` completed the unmodified backend test step successfully. It then failed frontend checks, so web/Capacitor/APK stages were skipped. Pages run `39645194595` succeeded on the same revision. No workflow was dispatched here; backend suite/test counts were not available from the inspected job metadata. T13's ESM correction has remote backend-step evidence, while full APK acceptance remains pending.

**Scope:** Jest / ts-jest configuration for `apps/mehrchain-backend`. Standard `npx nx test mehrchain-backend` fails to load ESM `@nestjs/passport`.
- [x] Update the actual backend config, `apps/mehrchain-backend/jest.config.cts`, to allow transformation of `@nestjs/passport` while retaining the dependency ignore for other packages and the PnP-file ignore. Enable `allowJs` only in `tsconfig.spec.json` so the existing ts-jest transform can compile that package's JavaScript into CommonJS.
- [ ] Ensure every current backend suite passes cleanly in standard CI without manual overrides; record the actual suite/test counts rather than reusing October 18's historical 15/124 result.
- [ ] Rerun the APK workflow on the reviewed revision and verify it reaches frontend checks, `mobile:build`, Capacitor sync and APK artifact creation. The October 21 run failed before these stages.

**October 21 local handoff:** T12 remains the first operational release gate. This session is restricted to reviewable working-tree changes, so its production migrations/deployment were not attempted; T13 is the next code-only correction. Source inspection confirmed installed Passport 12 declares `type: module` and exports ESM `.js` files. The fix retains the existing CommonJS runner, JWT/schedule test mappings and production compiler settings. No build, test, typecheck, dependency install, Prisma generation/migration, workflow dispatch, commit or push was performed. After review, run the unmodified `npx nx test mehrchain-backend` and record actual results; then run the APK workflow with publication disabled. This local configuration change does not establish a passing suite, APK creation or T12 release acceptance.

### T14 — Production email delivery setup (Resend API key & sender config) ([#71](https://github.com/farzad-bahadorifar/mehrchain/issues/71))

**Priority:** P1  
**Status: Pending owned sending domain and sender/key ([#71](https://github.com/farzad-bahadorifar/mehrchain/issues/71)).** October 21 Render inspection confirmed both variables are absent. The owner signed in to Resend, but its Domains page is empty and the owner confirmed they have no active domain. See [setup handoff](t14_email_setup_handoff.md). Email delivery acceptance remains a release gate.

**Scope:** Render environment variables & transactional OTP delivery.
- [ ] Configure `RESEND_API_KEY` in Render dashboard environment settings.
- [ ] Configure `MAIL_FROM` on a verified sending domain. `onboarding@resend.dev` is limited to test mail to the Resend account owner and does not satisfy production delivery.
- [ ] Test live OTP email delivery for registration and password reset on production.

### T15 — Address free-tier cold-start timeouts and proxy connection friction ([#72](https://github.com/farzad-bahadorifar/mehrchain/issues/72))

**Priority:** P1  
**Status: Local bounded-read retry correction implemented; idle/PWA acceptance pending ([#72](https://github.com/farzad-bahadorifar/mehrchain/issues/72)).** See [T15 handoff and warm measurements](t15_access_recovery_handoff.md).

**Scope:** User experience during Render backend spin-up (15-min idle) and Cloudflare Pages 524 timeouts.
- [x] Use a brief honest pending state and actionable retry for cold-start wake-up, consistent with T16's minimal UI; no persistent explanatory paragraph or fixed wait promise.
- [x] Inspect provider timeout documentation and checked-in proxies; retain their forwarding contract. GET/HEAD retry transient gateway errors once within the remaining budget; writes are never automatically replayed. Execution of the new retry regression source remains pending.
- [ ] Measure idle vs warm first-action response times using `scripts/measure-access-latency.cjs`.

### T16 — Restore minimal screens, visible Why and direct habit deletion

**Priority:** P1, required before v1 product acceptance; first of the three owner additions.

**Status:** Local implementation complete; execution/PWA acceptance pending. See [T16 handoff](t16_review_handoff.md). No GitHub issue was created in this session.

**Dependencies:** use T12's deployed-route/schema findings for the collection defect. Integrates T03/T05/T06/T07/T11. Update the affected OpenSpec daily-return/lifecycle deltas when implementing; preserve historical handoffs as evidence.

**Scope and acceptance:**

- [ ] Remove the recently added expandable rule/help sections, including `How daily habits work` and `About your progress`. Preserve the established onboarding introduction about companionship, the name MehrChain and how Chains work (October 22 owner clarification). Keep functional labels, input validation and concise confirmation consequences.
- [ ] Remove the Home archived-return banner and `Choose an archived habit to restore` link, plus equivalent redundant navigation links in Journey/Chain (including the collection shortcut inside explanatory copy). Navigation stays available through the bottom bar; restore stays in Journey's archived list.
- [ ] Place each archived habit's trash action at the right edge of its action row, keeping Restore accessible and alignment consistent on mobile/desktop and both themes.
- [ ] Show an optional, empty Why input directly in onboarding and in-app habit create/edit forms, including Chain quick-create where applicable. Use a clear label/placeholder such as `Why does this habit matter to you?`; placeholders never become submitted values. Retain a real user's reason when editing. The current source already starts new Why state empty, but hides it in details; verify shipped/cached clients rather than assuming the old sample is still the current default.
- [ ] Define and preserve custom-motivation eligibility: blank/whitespace and known app-supplied sample values, including `To prove to myself small steps matter`, do not qualify. Inspect legacy data/default provenance before any normalization; preserve actual user-written reasons and add an additive migration/metadata only if evidence requires it. No blanket destructive rewrite of existing reasons.
- [ ] Restore direct permanent deletion of an active habit from Home without an archive prerequisite. The compact dialog offers Keep/Cancel, Delete permanently and a distinct Archive choice. Render a qualifying custom Why visibly before the destructive confirmation; omit the reflection when no personal reason exists. Cancellation changes nothing; failed requests retain the habit and allow retry.
- [ ] Retain authorized server-side deletion, linked-Chain/invite cleanup and neutral T05 lifecycle receipts. Permanent deletion follows the existing history-deletion contract; Archive preserves history. Already-earned Mero slots/counters stay permanent and unrelated habits/partner data remain intact.
- [ ] Diagnose/fix Profile collection routing against T12's matching deployment and proxy, verify the refresh action, and replace raw `Cannot GET ...` output with a short useful error/retry state. Do not remove the collection feature to hide the defect.
- [ ] Verify the requested screenshots' corrections at phone widths and in the installed PWA; cover custom/empty/sample Why, cancel/archive/delete, reload and failed writes. Link final evidence from T09.

### T17 — Complete optional unique username management and identifier login

**Priority:** P1, v1 scope after T16 and operational auth prerequisites.

**Status:** Local implementation complete, with authorized OpenSpec proposal and disposable populated-copy migration rehearsal. Production migration, current suites/builds and real email/device acceptance remain pending. See [T17 handoff](t17_review_handoff.md); no GitHub issue was created.

**Dependencies:** T12/T13 for a working release/checks; T14 for verified password setup/recovery; T16 takes product-correction precedence.

**Original source baseline before this task:** Prisma required unique `User.username`; email signup collected it and Google generated one. Login queried email OR username but DTO/onboarding validation rejected usernames, and Profile had no management flow. The local implementation now corrects those gaps; see the handoff for migration and acceptance boundaries. Existing names retain explicit legacy provenance instead of guessing which were generated.

- [ ] Make the user-facing username optional and server-owned, with authenticated Profile add/edit/remove for both email and Google accounts. Choose a backward-compatible nullable-field/migration or explicit public-handle model; stable user IDs, account identity, habits, Chains and Mero ownership must not depend on a mutable username.
- [ ] Define one canonical case-insensitive username contract (reuse the existing 3–20 English letters/digits/underscore convention unless explicitly revised), availability response and behavior for edited/deleted handles. Preserve valid existing names and distinguish generated Google defaults from a user-selected handle.
- [ ] Add bounded/debounced server availability checks, but enforce normalized uniqueness atomically at save time with a database constraint and a useful conflict response. Availability alone does not reserve a name. Verify simultaneous claims, invalid values, unchanged own name and unauthorized edits.
- [ ] Fix API validation and frontend login so email or the current username plus password actually reaches authentication; keep existing email clients compatible. Decide whether `@username` is accepted and align placeholder, normalization and validation. Editing/removing a username invalidates that old handle for the account while email/Google access remains available.
- [ ] For Google-created accounts, offer a verified password-setup path before username/password login is advertised. Do not treat the generated internal credential as a usable password or change the verified email/account identity.
- [ ] Verify add/edit/remove and both login methods after reload, logout/login and another device, including blank-username accounts, Google accounts, case collisions, stale UI/session responses and preserved invites/Chains. Rehearse any additive migration on populated data and include it in the release gate.

### T18 — Offer updates when a newer GitHub release is available

**Priority:** P1, after T16/T17 and before the signed public v1 release. The v1 app must contain discovery so it can offer v1.0.1 and later updates.

**Status:** Implementation prepared in `codex/t18-t19-updates-mobile`; see the [T18/T19 handoff](t18_t19_review_handoff.md) and [OpenSpec delta](../openspec/changes/add-release-updates-mobile-touch/proposal.md). Signing configuration, deployment and real same-key upgrade acceptance remain open. No GitHub issue yet.

**Dependencies:** T13's functioning APK pipeline and T17's final app/schema contract before final acceptance.

**Historical source baseline before PR #73:** `VersionService` only tracks a hard-coded app version/changelog and Angular service-worker `VERSION_READY`; it does not query GitHub Releases or update installed APKs. `package.json` says `0.0.0`, the UI says `1.0.0`, and Android has `versionName "1.0"` / `versionCode 1`. Resolve this mismatch before release.

- [ ] Read trusted release metadata for `farzad-bahadorifar/mehrchain` through a bounded/cacheable public endpoint, without embedding credentials. Compare semantic versions against the running app; only a newer eligible stable release with a valid Android asset offers an APK update. Ignore drafts, previews/RCs, identical/older versions and malformed/missing assets. A commit/push alone is not a new app release.
- [ ] Show a compact in-app notice with the available version and Update/Later choices. Update opens the verified signed APK download/Android installation flow with the user's consent. Handle unavailable network, failed metadata/download and repeated dismissal without blocking habits or losing drafts; do not imply silent APK installation.
- [ ] Keep PWA service-worker updates and native APK updates as platform-specific flows under consistent version UI; a PWA reload must not be presented as an Android binary upgrade.
- [ ] Establish consistent build/release version metadata across UI, package, Android and Git tags; use a strictly increasing Android versionCode for each distributed update and retain the app ID/signing key.
- [ ] Repair `.github/workflows/build-apk.yml` prerelease detection before publishing another RC: its current `v1.*` condition incorrectly classifies `v1.0.0-rc*` as stable. GitHub's October 21 release listing confirms rc1–rc3 have `prerelease: false`. Stable update discovery must exclude RC tag suffixes even while historical release flags remain incorrect.
- [ ] Make official publication require a verified signed release artifact; do not publish debug/unsigned fallback binaries as the official APK. Make required generation/build/signing checks fail visibly rather than hiding failure with `|| true`. Verify APK identity, certificate, versionName/versionCode and checksums as part of the gate below.
- [ ] Verify newer/same/older/prerelease metadata and Later/retry behavior; test an actual same-key APK upgrade from a test build to a higher-version build without account/habit loss. Record real-device results in T09; simulated metadata is separate evidence from actual installation.

### T19 — Prevent mobile web/PWA page zoom and stabilize touch interaction

**Priority:** P1, owner-requested October 23; required before final mobile web/PWA acceptance.

**Status:** Implementation prepared in `codex/t18-t19-updates-mobile`; see the [T18/T19 handoff and pending device matrix](t18_t19_review_handoff.md) and [OpenSpec interaction delta](../openspec/changes/add-release-updates-mobile-touch/specs/mobile-interaction/spec.md). Physical-device/browser/PWA acceptance remains open; automated checks do not close it. No GitHub issue yet.

**Owner intent (corrected October 24):** Fit the available width/height on mobile devices and use the same centered mobile-width app shell in desktop PWA, including onboarding. Prevent pinch/double-tap page zoom and unintended zoom on form focus where browser policy allows it. Do not add Text size controls, font preferences or an extra toolbar. Avoid unnecessary page scrolling; retain scrolling when long content, a short landscape viewport or the keyboard requires it so actions stay reachable.

**Source baseline:** `apps/mehrchain-frontend/src/index.html` currently declares `width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content`, with no explicit zoom restriction. This is source evidence, not a reproduced device diagnosis. Inspect shared styles, form controls, swipe handling, modal scroll locks and Mero canvas interactions before selecting a fix. No backend/schema change is expected.

**Dependencies:** Preserve T01 responsive layout, T16's restored onboarding introduction and visible Why, T17 account forms and existing keyboard/swipe/navigation behavior. Coordinate any shared viewport change with Android WebView/Capacitor; native acceptance does not substitute for browser/PWA results.

- [ ] Reproduce and record pinch, double-tap and input-focus zoom separately on Android Chrome and iPhone Safari, each in a normal tab and installed standalone PWA. Record device/OS/browser versions, viewport scale before/after, route and gesture; distinguish browser page scale, OS magnification/text size, horizontal overflow and Mero-only gestures.
- [ ] Choose one consistent viewport/touch policy for the app shell and overlays. Evaluate viewport restrictions and scoped `touch-action` against the actual browser behavior; double-tap suppression alone is not pinch prevention. Retain device width, safe areas, keyboard resizing and responsive layout. Avoid duplicate/conflicting viewport tags, global `touch-action: none`, blanket `preventDefault()` on every touch, or forced scale resets that break scrolling/focus or cause jumping. If event handling is necessary, limit it to the relevant gesture/surface, document why, and clean up listeners.
- [ ] Audit computed input/select/textarea font sizes and focus behavior, including login/signup, verification/reset, username, Why, custom habit/duration and dialogs. Correct focus-induced zoom at its cause; verify focus/blur, keyboard open/close, autofill, OTP/password managers and moving between fields without residual scale, clipped buttons or lost drafts. Do not rely solely on a viewport flag.
- [ ] Preserve vertical/nested scrolling, taps, long press/text selection/copy/paste, onboarding swipes/back, sliders, modal interaction and Mero rendering. Check portrait/landscape rotation, narrow/short screens, safe-area devices, browser toolbar changes and background/resume/reload. No horizontal overflow, misaligned fixed navigation, stuck scroll or duplicate gesture-triggered writes.
- [ ] Fit mobile screen sizes without horizontal overflow or avoidable welcome-page scrolling. Keep every route, including onboarding, inside the centered mobile-width desktop PWA shell. Remove the unrequested Text size toolbar and saved app-specific font override. Preserve normal document scrolling for long content and keyboard-constrained forms.
- [ ] Record browser/platform limits: browser policy or user accessibility settings may override zoom restrictions. Keep readable form controls, device text settings, OS accessibility magnification and desktop browser shortcuts. No in-app text-resizing feature is in scope; document remaining platform/accessibility limitations for the release decision rather than promising an absolute lock.
- [ ] Verify all main routes and overlays on real devices in both themes, at 320/390 CSS-pixel widths and landscape; include first visit, existing installed PWA after service-worker update and fresh installation. Record exact frontend revision, browser/display mode, before/after evidence and each zoom trigger's result. Desktop touch/trackpad and Capacitor smoke checks cover shared-shell regressions; emulator screenshots alone do not establish mobile acceptance. Add focused regression coverage only for new gesture logic and listener cleanup if introduced.

**Exit condition:** On supported target configurations, pinch/double-tap do not scale the page and form focus does not auto-zoom; responsive fit, scrolling, input and navigation still work; desktop PWA remains compact and no Text size UI is present. Any browser-enforced exception is reproduced and documented with its scope and remaining release decision. Link the device matrix and evidence from T09; a changed meta tag or successful build alone does not complete T19.

**Implementation references:** [WebKit's zoom policy](https://webkit.org/blog/7367/new-interaction-behaviors-in-ios-10/), [W3C viewport/resize-text rule](https://www.w3.org/WAI/standards-guidelines/act/rules/b4f0c3/) and [W3C mobile text-resizing guidance](https://www.w3.org/TR/mobile-accessibility-mapping/). Recheck current target-browser behavior during implementation; the historical WebKit article does not prove current standalone-PWA behavior.

### T20 — Analyze and prototype the design system, palette and Mero colors

**Status / priority:** Discovery planned, P1. No implementation or prototype yet.

Audit the existing visual system and compare 2–3 coherent directions for palette,
typography, hierarchy, controls and Mero's body/belly colors in light/dark themes.
Deliver wireframes/specimens and a switchable `index.html` showing real screen
compositions, not only swatches. Preserve Mero's identity and earned user colors.
**Gate:** owner selects a direction/token mapping before shared styles change.

### T21 — Diagnose username saving and prototype account editing

**Status / priority:** Diagnosis and interaction design planned, P1; functional
diagnosis can proceed alongside T20, ahead of cosmetic work.

The owner's screenshot shows failed availability and `Cannot PATCH
/api/auth/username`. Trace actual routes, proxy, auth, deployed revisions, schema
and caches with T12/T17; do not assert the root cause from the screenshot. Deliver
a sanitized diagnosis/repair plan and `index.html` demonstrating edit/save/cancel,
intentional removal and accurate pending/conflict/retry feedback. Replace repeated
`(optional)` copy with restrained labels; required fields use `*` and accessible
semantics. **Gate:** review the diagnosis and chosen interaction before repair or
UI implementation; simulated saves are not a working-backend claim.

### T22 — Redesign Profile structure and reduce scrolling

**Status / priority:** Discovery planned, P1; depends on T20 direction and T21 flow.

Inventory/rank account, security, companion, colors, badges and settings. Compare
at least two wireframes, move occasional edits into deliberate subflows, and
deliver a clickable `index.html` with compact summaries and measured scroll/task
access comparisons. A Badge card opens T23; the color entry opens T24. Retain
theme/version/logout/account-deletion access and the restored onboarding content.
**Gate:** owner approves structure and visual prototype before Profile is rebuilt.

### T23 — Prototype a dedicated Badge page

**Status / priority:** Discovery planned, P1; coordinates with T22.

Replace Profile's growing full badge list with a summary entry opening a dedicated
page. Prototype navigation/back, earned/locked/progress/detail states and a future
large collection with synthetic data. Preserve current evidence-based earning
rules and privacy. **Gate:** owner reviews the linked HTML flow and growth model
before routes/components are implemented; no new achievement rules are implied.

### T24 — Redesign the 21-day color reward and collection experience

**Status / priority:** Discovery planned, P1; uses T20 tokens and T22 structure.

Compare two visual approaches for locked/progress/unlocked and collection/studio
states, including Mero preview, naming/selecting/saving a color and failed writes.
Deliver clickable `index.html` plus a state map. Preserve T06's first 21-day habit
streak, later collection-day/partner paths and permanent earned colors; preview is
distinct from saved selection. **Gate:** owner approves the reward/collection
experience before product implementation, with accessible reduced-motion states.

### T25 — Explore interactive color movement inside Mero's belly

**Status / priority:** Exploratory feasibility planned, P2; no v1 dependency yet.

Start with a simple visible 2D/canvas `index.html` to review the feel of dragging
color inside the belly. Only then consider an isolated Three.js shader/3D spike
for welcome/login and Profile on capable devices. Keep the effect inside the
belly, visual-only and independent of saved color/earned progress. Deliver a
performance budget/results, gesture policy coordinated with T19, reduced-motion
and static fallbacks, and a go/simplify/defer recommendation. Preserve scrolling,
Mero identity/moods and existing device safeguards. **Gate:** owner approves both
the effect and demonstrated performance before production integration.

**Shared acceptance for T20–T25:** Follow the detailed [UI/UX discovery brief](ui_ux_discovery_plan.md),
including screenshot observations, per-task checklists, HTML artifact locations,
mobile/desktop/theme/error states and a recorded owner decision. These are
analysis/prototype tasks, not authorization to implement their proposed designs.

## Next actions and release sequence

The owner additions are ordered **T16 → T17 → T18 → T19**, after existing operational blockers. This ordering supersedes the older numeric implementation sequence. All four are included in the proposed public v1 baseline; the unspecified Why reminder engine remains the T05 follow-up described above.

**Discovery track added October 23:** Start T21 diagnosis alongside T20, then review
T22 Profile and linked T23/T24 prototypes. Explore T25 simply before deciding on
3D. This design track can proceed while domain/release prerequisites are pending.
Approve implementation scopes separately and explicitly add chosen redesigns to
the release candidate; T25 does not automatically delay v1. Existing functional
blockers, including username saving, still need verified resolution.

| Order | Work | Exit condition |
| --- | --- | --- |
| 1 | **T12 — establish a working matching release** | Inspect actual revision/migration history first, back up/rehearse, apply only pending reviewed migrations, verify matching Render/Pages identity and schema readiness; diagnose collection routing |
| 2 | **T13 — unblock normal tests and APK CI** | Standard backend checks pass and the workflow reaches Capacitor sync/APK artifact creation |
| 3 | **T14 — real email delivery** | Registration/verification and password reset actually deliver and work for intended users; this provides T17's delivery prerequisite |
| 4 | **T08/T15 — access reliability** | Measured idle/warm behavior, bounded waits/retries and usable failure recovery on real target networks |
| 5 | **T16 — owner product corrections** | Minimal screens, always-visible empty optional Why, custom-reason deletion reflection, direct delete and working collection |
| 6 | **T17 — username completion** | Server-enforced optional unique handle management and end-to-end email/username/Google-account access; any new migration deployed through the same gate |
| 7 | **T18 — opt-in release update discovery** | Correct stable-version comparison, compact update prompt, coherent metadata and safe signed-release pipeline |
| 8 | **T19 — mobile web/PWA zoom control** | Real-device pinch/double-tap/focus matrix, supported page-scale lock, responsive mobile fit, compact desktop PWA, usable keyboard/scrolling and explicit browser exceptions |
| 9 | **T09 — accept the final candidate** | Current automated checks, deployed two-account/PWA flows, daily/absence/Chain cases, real Android auth and upgrade acceptance; record exact revisions and resolve release blockers |
| 10 | **Android v1 release gate below** | Fresh accepted signed APK, matching commit/schema/version, release notes/checksum and verified installation; then `v1.0.0` publication |

**Starting instruction for the next work session:** Read this roadmap and the T12–T17 handoffs. Review/check the local candidate first; T05/T06 are already applied to production, while T17 is rehearsed only on a disposable copy. T14 needs an owned DNS-verifiable sending domain and Render mail configuration. Recheck actual revisions/history before any release, use a fresh snapshot and the isolated release gate for T17, and complete automated/APK/PWA/device acceptance. Continue from the first unmet exit condition; T18/T19 implementation is merged; T19 layout corrections are in review and runtime/release acceptance remains open.

## Android synchronization and public v1 release gate

**Capacitor status (October 21):** configured dependencies are `@capacitor/{core,android,ios,cli} ^8.5.0`; that is a dependency declaration, not proof of asset sync or the latest available framework version. The ignored local Android assets still contain the August 30 build. `npm run mobile:build` already builds the production frontend and runs `cap sync`; the APK workflow calls it on its checked-out revision, but the latest inspected workflow skipped it after failing backend tests. No automatic native update follows merely from editing/pushing web code. This is distinct from T06's earned-color *capacity*, whose formula is preserved above and whose runtime still needs T12/T09 evidence.

1. **Get a current test APK without publishing.** After T13 and the desired feature changes pass, run **Build & Release Android APK → Run workflow** on the reviewed branch with `publish_release=false`, or use a normal main/PR build. Download the new `mehrchain-apk-builds` artifact and record its SHA/run ID; do not reuse the October 6 handoff's artifact, whose documented retention ended October 20. Locally, the equivalent asset step is `npm run mobile:build`; this runs Capacitor sync but does not itself build/sign an APK. Gradle/CI performs APK packaging afterwards.
2. **Freeze a candidate and accept it.** Complete T12–T19 and T09's applicable checks on the exact candidate, including matching production frontend/backend/schema, real Android Google and email/username entry, collection, save/retry, direct delete, mobile web/PWA zoom behavior and multi-account flows. Record multi-day field results separately from controlled-clock checks. Resolve/disposition existing release-risk findings from the test handoff; historical test counts or old successful APK runs cannot accept this revision.
3. **Prepare the signed candidate before a public tag.** Reconcile UI/package/Android version to `1.0.0`; select a versionCode greater than every previously distributed build and keep it increasing for future updates. Confirm the four signing secrets from the [signing guide](android_signing_guide.md) privately, the signing certificate/app ID, correct production API/Google config, fresh build identity and release notes. Build with publication disabled, verify the signed APK and checksum, install it on a phone and test a same-key upgrade. Keep signing material private. T18 must fix RC classification and block official publication without a signed artifact first.
4. **Tag only the accepted commit.** Check that remote tag `v1.0.0` does not already exist; the October 21 release listing only established existing previews through `v1.0.0-rc3`. After acceptance, create an annotated `v1.0.0` tag on the reviewed committed revision and push that tag. The existing `v*` workflow immediately builds and publishes a public GitHub Release when successful, so pushing the tag is the publication step, not a harmless way to request a test APK. No tag, push or Release is performed by this roadmap update.
5. **Verify the published result.** Verify the tagged workflow's signed artifact against the accepted candidate's identity/certificate/version, published checksum and release notes; download/install the actual release and confirm a later eligible release produces T18's optional update notice. If Android auth/installation is still failing, Android v1 is not ready even if PWA acceptance passes. A PWA-only release requires an explicit separate scope decision.

## Scope and completion

The active roadmap spans **T00–T25**. T00–T15 retain their existing GitHub issue references; T16–T25 are local roadmap tasks awaiting issue/Project synchronization. T00–T04, T10 and T11 retain their recorded completed status. T05–T08 have historical implementations with release/field acceptance outstanding; T07 also requires T16's owner corrections. T09 is acceptance work, T12–T15 are stabilization, T16–T19 are the requested v1 work, and T20–T25 are analysis/prototype packages awaiting owner decisions before implementation. Completion requires evidence for the exact released revision, including the signed Android gate; documentation, a push, Capacitor dependency versions or a successful old build do not establish that result.
