# MehrChain — Development Roadmap

> From v0.9.0-preview to production-ready v1.0 and beyond.
> Updated: 2026-10-04
> Target Audience: English-speaking users
> Release status: **Recovery work in progress.** Code-complete items below are not evidence of a working production flow.

---

## 📅 Master Schedule & Timeline

### Revised release gates (as of October 4, 2026)

The target is a **private field test with 5–10 friends and family this week**, preceded by a two-account internal smoke test. October 8 remains a **conditional** v1.0 target, not an automatic release date. A visible habit or chain in local storage does not count as a passed database test.

| Target | Assignment & Issue | Gate | Required evidence | Decision | Status |
|--------|-------------------|------|-------------------|----------|:------:|
| Oct 4 | [[#46]](https://github.com/farzad-bahadorifar/mehrchain/issues/46) R0 | Establish production truth | Identify deployed backend revision, Render database target, actual tables/schema, and migration state without changing data | If unknown, do not treat production as ready | ✅ Done |
| Oct 4–5 | [[#47]](https://github.com/farzad-bahadorifar/mehrchain/issues/47) R1 | Restore production foundation | Safe database migration and current backend deployment; public API routes answer with expected status codes | If blocked, move the field test | ✅ Done |
| Oct 5–6 | [[#48]](https://github.com/farzad-bahadorifar/mehrchain/issues/48) R2 & [[#49]](https://github.com/farzad-bahadorifar/mehrchain/issues/49) R3 | Complete real account & auth | Real authentication, Google web client ID, no mock fallback, database-backed user identity | If any auth path relies on mock tokens or disclosed OTP, stop | 🔄 In Progress |
| Oct 5–6 | [[#50]](https://github.com/farzad-bahadorifar/mehrchain/issues/50) R4 | Complete solo habit path | Database-backed habit creation (`isPublic`), Spark, sign-out/sign-in, and second-browser reload | If any action only survives in local storage, stop | ⏳ Ready |
| Oct 6–7 | [[#51]](https://github.com/farzad-bahadorifar/mehrchain/issues/51) R5 | Complete two-user chain path | Server-issued invite code, acceptance by another account, connections visible after reload for both users | If the chain is local-only, stop | ⏳ Ready |
| Oct 7 | [[#52]](https://github.com/farzad-bahadorifar/mehrchain/issues/52) R6 | Heart & deletion isolation | Verified Heart reaction persistence, account deletion cascading cleanup and user cache isolation | If data leaks across accounts or deletion fails, stop | ⏳ Ready |
| Oct 7 | [[#53]](https://github.com/farzad-bahadorifar/mehrchain/issues/53) R7 | Internal smoke test | Two accounts on separate browsers/devices pass the full flow; deletion and failure paths checked | Invite external testers only after pass | ⏳ Ready |
| Oct 7–8 | [[#54]](https://github.com/farzad-bahadorifar/mehrchain/issues/54) R8 | Private field test | 5–10 testers; record completion rate, blockers, and data persistence evidence | Fix blocking defects before release | ⏳ Ready (Decision Gate) |
| Oct 8 | Launch Gate | Conditional public launch | All release gates pass on deployed frontend, backend, and database | Otherwise postpone the tag and announcement | ⏳ Conditional |

**Minimum field-test journey:** real sign-up or Google sign-in → create a public or private habit → Spark → sign out and sign back in → see the same account and habit → create a server-issued chain invite → second real account accepts with its own habit → both accounts see the connection after refresh → send a heart → delete a test account and confirm cleanup. A solo user must be able to complete the account and habit journey without creating a chain.

### Original sprint record (implementation history, not release verification)

### v1.0.0 Launch Sprint (Oct 1–8; original plan)

| Day | Date | Focus | Tasks & GitHub Issues | Status |
|-----|------|-------|-----------------------|:------:|
| 1 | Oct 1 | 🔴 Bug Fixes | [[#30]](https://github.com/farzad-bahadorifar/mehrchain/issues/30) OTP `previewCode` auto-fill (✅) • [[#31]](https://github.com/farzad-bahadorifar/mehrchain/issues/31) Account deletion fix (✅) • [[#32]](https://github.com/farzad-bahadorifar/mehrchain/issues/32) English email template (✅) | ✅ Done |
| 2 | Oct 2 | 🟡 Profile Simplify | [[#33]](https://github.com/farzad-bahadorifar/mehrchain/issues/33) Remove color swatch grid & scroll-on-tap • Keep nickname + 21-day only | ✅ Done |
| 3 | Oct 3 | 🟡 Journey + Spark | [[#34]](https://github.com/farzad-bahadorifar/mehrchain/issues/34) Journey redesign & badges (✅) • [[#35]](https://github.com/farzad-bahadorifar/mehrchain/issues/35) "Endless Journey" + Custom duration (✅) • [[#36]](https://github.com/farzad-bahadorifar/mehrchain/issues/36) "I did it" → "Spark" + CSS animation (✅) | ✅ Done |
| 4 | Oct 4 | 🟡 Loading UX & Badges Polish | [[#37]](https://github.com/farzad-bahadorifar/mehrchain/issues/37) Skeleton loading • Cold start message • Shorten all UI text (✅) • [[#42]](https://github.com/farzad-bahadorifar/mehrchain/issues/42) Move Badges to Profile • Streak card cleanup • Custom duration placeholder (✅) | ✅ Done |
| 5 | Oct 5 | 🟢 Connectivity & Auth | [[#41]](https://github.com/farzad-bahadorifar/mehrchain/issues/41) Cloudflare API Proxy (/api/*) (✅) • [[#43]](https://github.com/farzad-bahadorifar/mehrchain/issues/43) Google Sign-In (✅) | ✅ Done |
| 6 | Oct 6 | 🟢 Features & Landing | [[#38]](https://github.com/farzad-bahadorifar/mehrchain/issues/38) Articles (✅) • [[#39]](https://github.com/farzad-bahadorifar/mehrchain/issues/39) What's New (✅) • [[#40]](https://github.com/farzad-bahadorifar/mehrchain/issues/40) Landing CTA & polish (✅) | ✅ Done |
| 7–8 | Oct 7–8 | 🧪 User Testing | Original target: 3–5 testers; revised target and gates above: 5–10 testers after internal smoke test | ⏳ Gated |
| 9 | Oct 8 | 📦 Launch | Tag v1.0.0 and announce only if all revised release gates pass | ⏳ Conditional |

### Completed Tasks (Pre-Launch & Sprint)

The statuses in this historical table describe repository work recorded at the time. They do **not** certify deployment, database persistence, security, or successful field testing; use R0–R8 for current release readiness.

| Issue | Task Title | Phase | Status | Date | Notes |
|:-----:|------------|-------|:------:|:----:|-------|
| [#45](https://github.com/farzad-bahadorifar/mehrchain/issues/45) | Profile Mero Mood System — Remove squish, add Three.js mood particles | v1.0 Launch Sprint | ✅ Done | Oct 4 | Removed Mero squish-on-click globally. Added MeroMoodService (sad/happy/kind) + ProfileMeroComponent with Three.js WebGL particles on Profile page only. Mood driven by daily sparks + chain heart support |
| [#40](https://github.com/farzad-bahadorifar/mehrchain/issues/40) | Update landing page + final English text review + root README | v1.0 Launch Sprint | ✅ Done | Oct 3 | Updated GitHub Pages landing page (v1.0.0, Mero hero, philosophy), verified 100% English text across monorepo, updated root README.md |
| [#39](https://github.com/farzad-bahadorifar/mehrchain/issues/39) | "What's New" section in Profile + version dot indicator | v1.0 Launch Sprint | ✅ Done | Oct 3 | Added collapsible What's New changelog to Profile and blue notification dot on navbar Profile tab with VersionService |
| [#38](https://github.com/farzad-bahadorifar/mehrchain/issues/38) | Articles "Coming Soon" placeholder card in Chain page | v1.0 Launch Sprint | ✅ Done | Oct 3 | Added minimal Mindful Reads / Articles Coming Soon card with Lucide book-open icon at bottom of Chain |
| [#42](https://github.com/farzad-bahadorifar/mehrchain/issues/42) | Move Badges to Profile + clean dashboard streak card + custom duration placeholder | v1.0 Launch Sprint | ✅ Done | Oct 3 | Moved Milestones & Badges to Profile, cleaned redundant flame icon from streak card, set custom duration placeholder to 'e.g. 21' |
| [#41](https://github.com/farzad-bahadorifar/mehrchain/issues/41) | Setup Cloudflare API Proxy for backend requests (/api/*) | v1.0 Launch Sprint | ✅ Done | Oct 3 | Cloudflare Pages Functions & `_redirects` proxying `/api/*` to Render, bypassing ISP blocks in Iran |
| [#43](https://github.com/farzad-bahadorifar/mehrchain/issues/43) | Implement Google Sign-In authentication (OAuth / One-Tap) | v1.0 Launch Sprint | ✅ Done | Oct 3 | 1-click Google OAuth / ID token login with backend verification & GoogleAuthService |
| [#37](https://github.com/farzad-bahadorifar/mehrchain/issues/37) | Skeleton loading screens + cold start warmup notification + shorten UI text | v1.0 Launch Sprint | ✅ Done | Oct 3 | Skeletons for Dashboard/Chain/Journey, ColdStartService (>5s alert), Lucide icon cleanup & English text shortening |
| [#34](https://github.com/farzad-bahadorifar/mehrchain/issues/34) | Journey page redesign & badge system foundations (5 initial badges with Lucide icons) | v1.0 Launch Sprint | ✅ Done | Oct 2 | Removed duplicate profile card, added 5-badge milestone system |
| [#35](https://github.com/farzad-bahadorifar/mehrchain/issues/35) | Commitment duration — "Endless Journey" (-1) + Custom days | v1.0 Launch Sprint | ✅ Done | Oct 2 | Replaced presets with Endless Journey (-1) and Custom days across modals, onboarding, and backend |
| [#36](https://github.com/farzad-bahadorifar/mehrchain/issues/36) | Spark button — rename from "I did it" with Lucide sparkles icon & CSS pulse animation | v1.0 Launch Sprint | ✅ Done | Oct 2 | Replaced completion button with animated Spark button and completed state |
| [#33](https://github.com/farzad-bahadorifar/mehrchain/issues/33) | Profile Simplification — remove swatches grid & scroll-on-tap, keep nickname & 21-day glow | v1.0 Launch Sprint | ✅ Done | Oct 1 | Removed color swatch grid & tap tooltip, preserved 21-day custom glow reward |
| [#31](https://github.com/farzad-bahadorifar/mehrchain/issues/31) | Fix account deletion — only clear local state on backend success | v1.0 Launch Sprint | ✅ Done | Sep 30 | Fixed deleteAccount error handling & storage retention |
| [#32](https://github.com/farzad-bahadorifar/mehrchain/issues/32) | Translate OTP email template to English | v1.0 Launch Sprint | ✅ Done | Sep 30 | English dark-themed HTML/text OTP email template |
| [#30](https://github.com/farzad-bahadorifar/mehrchain/issues/30) | OTP auto-fill from previewCode | v1.0 Launch Sprint | ✅ Done | Sep 30 | Auto-fill verification code & helper message |
| [#2](https://github.com/farzad-bahadorifar/mehrchain/issues/2) | Implement ChainModule API & Prisma Migration | Phase 1 (Chain Backend) | ✅ Done | Sep 22 | Prisma models, controller & service |
| [#6](https://github.com/farzad-bahadorifar/mehrchain/issues/6) | Unit tests for ChainService + Cron | Phase 1 (Chain Backend) | ✅ Done | Sep 22 | 76 unit tests passing |
| [#7](https://github.com/farzad-bahadorifar/mehrchain/issues/7) | Rewrite ChainService frontend | Phase 1 (Chain Frontend) | ✅ Done | Sep 23 | localStorage + API hybrid sync |
| [#8](https://github.com/farzad-bahadorifar/mehrchain/issues/8) | New ChainCardComponent (5 states) | Phase 1 (Chain Frontend) | ✅ Done | Sep 24 | Minimal 5-state card component |
| [#9](https://github.com/farzad-bahadorifar/mehrchain/issues/9) | Remove Chain page clutter | Phase 1 (Chain Frontend) | ✅ Done | Sep 24 | Removed bell, love, emojis, demo chain |
| [#10](https://github.com/farzad-bahadorifar/mehrchain/issues/10) | Unread dot on Chain navbar tab | Phase 1 (Chain Frontend) | ✅ Done | Sep 25 | Activity badge indicator |
| [#11](https://github.com/farzad-bahadorifar/mehrchain/issues/11) | Invite section cleanup | Phase 1 (Chain Frontend) | ✅ Done | Sep 25 | InviteSectionComponent & Lucide icons |
| [#18](https://github.com/farzad-bahadorifar/mehrchain/issues/18) | Mobile & PWA UX optimization | Phase 2 (Mobile) | ✅ Done | Sep 24 | Viewport bounce, zoom lock, 100dvh |
| [#21](https://github.com/farzad-bahadorifar/mehrchain/issues/21) | Status bar safe area overlap | Phase 2 (Mobile) | ✅ Done | Sep 24 | Dynamic safe-area-inset-top padding |
| [#19](https://github.com/farzad-bahadorifar/mehrchain/issues/19) | Custom commitment duration validation | Phase 2 (Validation) | ✅ Done | Sep 24 | Rejection of 0 or negative days |
| [#26](https://github.com/farzad-bahadorifar/mehrchain/issues/26) | Onboarding public habit toggle | Phase 2 (Validation) | ✅ Done | Sep 27 | isPublic toggle in DetailsStepComponent |
| [#27](https://github.com/farzad-bahadorifar/mehrchain/issues/27) | UI Loading & Anti-Spam click protection | Phase 2 (UX) | ✅ Done | Sep 27 | Loading spinners & request debouncing |
| [#28](https://github.com/farzad-bahadorifar/mehrchain/issues/28) | Fix Chain Invite URL + OTP + Account Deletion | Phase 3 (Stability) | ✅ Done | Sep 28 | Capacitor URL fallback, auth hardening |
| [#22](https://github.com/farzad-bahadorifar/mehrchain/issues/22) | Refactor & Split OnboardingComponent | Phase 2 (Refactor) | ✅ Done | Sep 27 | Step components + auth modals (closed #5, #12) |
| [#13](https://github.com/farzad-bahadorifar/mehrchain/issues/13) | Remove Mero Personality section | Phase 2 (Cleanup) | ✅ Done | Sep 24 | Profile cleanup & tests verified |
| [#14](https://github.com/farzad-bahadorifar/mehrchain/issues/14) | Remove console.log debug calls | Phase 2 (Cleanup) | ✅ Done | Sep 24 | Codebase cleanup |
| [#24](https://github.com/farzad-bahadorifar/mehrchain/issues/24) | Setup SMTP (Resend) | Phase 3 (Stability) | ✅ Done | Sep 27 | Free tier: 3K emails/month (closed #17) |
| [#23](https://github.com/farzad-bahadorifar/mehrchain/issues/23) | Add backend tests to CI pipeline | Phase 3 (Stability) | ✅ Done | Sep 27 | GitHub Actions backend test step (closed #16) |
| [#25](https://github.com/farzad-bahadorifar/mehrchain/issues/25) | Signed Release APK (GitHub Actions) | Phase 3 (Mobile) | ✅ Done | Sep 27 | Keystore signing CI workflow (closed #15) |

---

## Production readiness snapshot (October 4, 2026)

The following is an audit snapshot, not a claim that all production services work. Recheck it after each deployment. The previous claim that the infrastructure was complete and sized for hundreds of users was not validated by an end-to-end production test.

| Component | What is known | What must still be proved |
|-----------|---------------|---------------------------|
| Frontend / Cloudflare Pages | The public `/api` proxy answered `200` with `Hello API` during the October 4 audit. | Confirm the frontend build revision, routes, and proxy after deployment. A working proxy root does not prove feature routes work. |
| Backend / Render | Public `POST https://mehrchain.pages.dev/api/auth/google` returned `404` on October 4, although `AuthController` in the repository defines it. | Identify the deployed commit and deploy the current backend; verify actual auth, habit, and chain routes. |
| Neon PostgreSQL | The repository has a Prisma schema and new manual initialization scripts, but their presence does not prove execution. A read-only connection attempt from the audit environment failed. | Verify the database URL used by Render, table/column existence, constraints, and migration history with read-only queries before changing the schema. Do not state that tables are present or absent until checked against Render's database. |
| Google sign-in | Production frontend contains `891234567890-mock.apps.googleusercontent.com`; fallback creates a random local `Tester Google` identity. Backend source accepts mock Google tokens. | Configure a real web client ID, disable production mock/offline login, validate token audience and issuer, and prove stable login to a database user. |
| Email verification | Resend delivery requires a verified sender/domain. The API source currently returns `previewCode`, and the frontend auto-fills it. | Choose a real delivery path before email-account field testing; never use an API-disclosed OTP as proof of email ownership. |
| Habit persistence | Backend CRUD exists, but frontend retains optimistic local data when remote writes fail. `isPublic` is absent from the create DTO and persistence path. | Prove create, Spark, refresh, and second-browser reload from the database; make remote failures visible. |
| Chain persistence | Backend invite/connection APIs exist, but the UI shares a commitment ID instead of a server-issued invite code and does not await acceptance. | Prove invite creation and two-account acceptance against the backend, then verify both accounts after refresh. |
| Account deletion | Backend user deletion and main cascades exist; frontend does not clear all user-scoped caches. `ChainInvite.acceptedById` is a scalar, not a foreign key. | Test deletion against the real database, stale tokens, cache cleanup, and retained invite references. |
| CI / Android / landing page | Build workflows and the public landing page are present. | They are outside the field-test critical path; verify only if used to distribute this test build. |

### Audit references

- Frontend Google configuration: `apps/mehrchain-frontend/src/environments/environment.prod.ts`; local fallback: `apps/mehrchain-frontend/src/app/core/services/google-auth.service.ts`.
- Backend Google and OTP behavior: `apps/mehrchain-backend/src/app/auth/auth.service.ts`; public Google route: `apps/mehrchain-backend/src/app/auth/auth.controller.ts`.
- Habit storage and API behavior: `apps/mehrchain-frontend/src/app/core/store/commitment.store.ts`; create DTO and service: `apps/mehrchain-backend/src/app/commitments/`.
- Chain flow: `apps/mehrchain-frontend/src/app/core/services/chain.service.ts`, `apps/mehrchain-frontend/src/app/features/chain/chain.ts`, and `apps/mehrchain-frontend/src/app/features/chain/components/invite-section/`.
- Schema and deployment: `apps/mehrchain-backend/prisma/schema.prisma`, `apps/mehrchain-backend/prisma/migrations/`, `render.yaml`, and `functions/api/[[path]].js`.

---

## Release recovery work — small, reviewable assignments

**Execution rule:** Give one numbered assignment to one model at a time. Ask it to change only the named scope, report changed files and tests, and show concrete acceptance evidence. Keep production secrets out of prompts and logs. Mark a task complete only when its acceptance criteria pass on the intended environment. Do not infer production success from unit tests, a local cache, or an HTTP `200` from an unrelated route.

**Priority:** P0 blocks the private field test. P1 should be fixed before public launch, or the related feature must be explicitly excluded from the test. P2 remains post-launch. Each assignment below is narrow enough to run and review separately.

| Assignment | GitHub Issue | Priority | Target Date | Depends on | Status |
|:----------:|:------------:|:--------:|:-----------:|:----------:|:------:|
| **R0** | [#46](https://github.com/farzad-bahadorifar/mehrchain/issues/46) | 🔴 P0 | Oct 4 | None | ✅ Done |
| **R1** | [#47](https://github.com/farzad-bahadorifar/mehrchain/issues/47) | 🔴 P0 | Oct 4–5 | R0 ([#46](https://github.com/farzad-bahadorifar/mehrchain/issues/46)) | ✅ Done |
| **R2** | [#48](https://github.com/farzad-bahadorifar/mehrchain/issues/48) | 🔴 P0 | Oct 5 | R1 ([#47](https://github.com/farzad-bahadorifar/mehrchain/issues/47)) | 🔄 In Progress |
| **R3** | [#49](https://github.com/farzad-bahadorifar/mehrchain/issues/49) | 🔴 P0 | Oct 5–6 | R2 ([#48](https://github.com/farzad-bahadorifar/mehrchain/issues/48)) | ⏳ Ready |
| **R4** | [#50](https://github.com/farzad-bahadorifar/mehrchain/issues/50) | 🔴 P0 | Oct 5–6 | R1, R2, R3 | ⏳ Ready |
| **R5** | [#51](https://github.com/farzad-bahadorifar/mehrchain/issues/51) | 🔴 P0 | Oct 6–7 | R4 ([#50](https://github.com/farzad-bahadorifar/mehrchain/issues/50)) | ⏳ Ready |
| **R6** | [#52](https://github.com/farzad-bahadorifar/mehrchain/issues/52) | 🔴 P0 | Oct 7 | R5 ([#51](https://github.com/farzad-bahadorifar/mehrchain/issues/51)) | ⏳ Ready |
| **R7** | [#53](https://github.com/farzad-bahadorifar/mehrchain/issues/53) | 🔴 P0 | Oct 7 | R0–R6 | ⏳ Ready |
| **R8** | [#54](https://github.com/farzad-bahadorifar/mehrchain/issues/54) | 🔴 P0 | Oct 7–8 | R7 ([#53](https://github.com/farzad-bahadorifar/mehrchain/issues/53)) | ⏳ Ready (Decision Gate) |

### R0 — Establish production truth (P0, read-only, Oct 4) • [[#46]](https://github.com/farzad-bahadorifar/mehrchain/issues/46) ✅ Done

**Scope:** `render.yaml`, Cloudflare Pages configuration, the deployed Render service/revision, and the exact Neon database used by Render. No schema changes or account creation.

**Hand-off prompt:** "Audit the deployed MehrChain stack without changing data. Record the deployed backend commit/build time, the API base URL, route responses for `GET /api` and a deliberately invalid `POST /api/auth/google`, and the database target configured in Render. With read-only SQL, report whether `users`, `commitments`, `commitment_logs`, `chain_connections`, `chain_invites`, and `_prisma_migrations` exist and whether required columns, indexes, and foreign keys match `schema.prisma`. Redact secrets and do not print connection strings. Return evidence, uncertainty, and exact next actions."

**Acceptance:** A reviewer can identify the active backend revision, Render's database target, and actual schema state. `404` on `POST /api/auth/google` is resolved to a deployment/routing cause before any auth debugging continues. If database access is unavailable, record **unverified**, not **missing**.

### R1 — Make schema deployment safe and repeatable (P0, depends on R0, Oct 4–5) • [[#47]](https://github.com/farzad-bahadorifar/mehrchain/issues/47) ✅ Done

**Scope:** `apps/mehrchain-backend/prisma/schema.prisma`, its migration directory, deployment documentation/configuration, and any existing initialization scripts. Preserve existing user data.

**Hand-off prompt:** "Compare the current Prisma schema to the verified Render database. Prepare a reviewed, additive migration or a documented baseline path appropriate to the current database. Back up the database before applying any production change. Remove `prisma db push --accept-data-loss` from the automatic Render build path. Do not run manual `CREATE TABLE IF NOT EXISTS` scripts blindly and do not silently drop or rewrite columns. Verify the resulting tables, constraints, and Prisma Client compatibility with read-only queries."

**Acceptance:** `users`, `commitments`, logs, chains, and invites have the required schema; deployment has no destructive automatic schema push; a second deployment does not damage or duplicate data. Record the migration version and rollback/restore procedure. A historical migration directory without current chain schema is not sufficient proof.

### R2 — Secure and deploy real authentication (P0, depends on R1, Oct 5) • [[#48]](https://github.com/farzad-bahadorifar/mehrchain/issues/48) 🔄 In Progress

**Scope:** backend auth controller/service, auth DTOs, mail behavior, auth-focused tests, and Render configuration; keep unrelated endpoints untouched.

**Hand-off prompt:** "In production, reject `mock_google_` and `test-google-token`. Verify Google ID token validity, issuer, expiry, verified email, and `aud` against the configured web client ID before finding or creating a user. Keep same-email login stable. Remove `previewCode` from production registration and resend responses, and ensure an already-verified user cannot obtain a JWT by posting any code to `verify-email`. Add focused tests for these failures and success cases. Deploy the backend and prove the public `POST /api/auth/google` is routed (an invalid token should be rejected by auth, not 404)."

**Acceptance:** Mock/invalid tokens cannot create sessions in production; a real valid token maps repeated logins to the same database user ID; OTP responses do not disclose the code in production; an arbitrary code cannot mint a token. The deployed public route matches the current source.

### R3 — Configure the frontend's real sign-in path (P0, depends on R2, Oct 5–6) • [[#49]](https://github.com/farzad-bahadorifar/mehrchain/issues/49)

**Scope:** frontend production environment/build configuration, Google sign-in service, sign-up/login screens, and focused tests.

**Hand-off prompt:** "Replace the mock Google web client ID through the frontend build configuration and configure the correct authorized JavaScript origin. Remove random-email `Tester Google` and local offline fallback from production sign-in. If One Tap is unavailable or skipped, offer a supported Google sign-in button or a clear retry/error state; never convert a failed API request into a successful local account. Keep demo behavior, if needed, restricted to an explicit development-only path. On returning to the app, verify the server session with `/auth/me` and handle invalid tokens clearly."

**Acceptance:** Two sign-ins with the same Google account return the same database user ID. A failed Google prompt, blocked script, rejected token, or unavailable backend never shows an authenticated production user. Test on the actual Pages origin and a fresh browser profile.

**Authentication fallback for the deadline:** If Google Cloud setup cannot be completed in time, use email/password only after real OTP delivery to each tester works. An auto-filled `previewCode` or demo account is not an acceptable substitute for a real account test. If neither real route works, defer external testing.

### R4 — Persist the solo habit journey and make failures honest (P0, depends on R1–R3, Oct 5–6) • [[#50]](https://github.com/farzad-bahadorifar/mehrchain/issues/50)

**Scope:** backend commitment create/update DTO and service, frontend commitment store and onboarding/dashboard error handling, focused tests.

**Hand-off prompt:** "Add and validate `isPublic` in the backend create path and persist it; verify the request payload accepted by the global validation pipe. For a remote-authenticated user, make create, Spark, edit, archive, restore, and permanent delete report remote failures instead of silently treating local cache as success. Roll back optimistic state or show an explicit unsynced state; choose one consistent rule for the field test. Preserve explicit offline/demo behavior only outside the production account path. Test create and Spark through HTTP with a real token, then reload from the server."

**Acceptance:** A public habit is actually stored with `isPublic=true`; a private habit remains private. Its server ID, Spark count/date, and history survive sign-out/sign-in and a different browser. A failed API write cannot show an unqualified success or generate a chain invite for a local-only ID. A solo account can use the product without a partner.

### R5 — Use server-issued invites for the entire chain flow (P0, depends on R4, Oct 6–7) • [[#51]](https://github.com/farzad-bahadorifar/mehrchain/issues/51)

**Scope:** frontend ChainService, ChainComponent, InviteSection and QR/share UI, plus only the backend chain behavior required for the flow.

**Hand-off prompt:** "When a user selects a persisted public habit, call `POST /chain/invite` and build Share, Copy, and QR URLs from the returned `inviteCode`. Load incoming invite details with `GET /chain/invite/:code`; show expired/used/invalid states. Pass that same code and the receiver's persisted habit ID to `POST /chain/invite/:code/accept`. Await the response before showing success or dismissing the invite. Never manufacture a local connection for a remotely authenticated user. Reload connections for both users after acceptance and show API errors without a success toast."

**Acceptance:** Two real users in separate browsers each see the same new chain after refresh; the invite is a server record and its code is distinct from the sender's habit ID; expired/invalid/self-invite attempts fail visibly. Share, Copy, and QR contain the same valid URL. The backend refuses a non-public sender habit.

### R6 — Verify heart, deletion, and user data isolation (P0, Oct 7) • [[#52]](https://github.com/farzad-bahadorifar/mehrchain/issues/52)

**Scope:** chain reaction persistence, account deletion endpoint, Prisma relationships, frontend auth/chain/customization cache cleanup, and focused tests.

**Hand-off prompt:** "Use two database users to verify Heart is saved and visible after reload. Delete one test account through the app, then query the database for remaining user, commitment, log, connection, and invite records. Resolve how `ChainInvite.acceptedById` and `acceptedCommitmentId` should behave when the accepting user or habit is deleted; they are currently scalar fields, not cascading foreign keys. Clear only the deleted user's scoped commitment, chain, visit, and customization caches. Check that a stale token and another signed-in account cannot see the deleted user's data."

**Acceptance:** Deletion succeeds only after a successful backend response, removes the account's related data according to the documented policy, invalidates its access, and leaves no deleted user's content visible on reload or account switch. Heart behavior persists across reload for the intended users.

### R7 — Deploy and run a two-account release smoke test (P0, depends on R0–R6, Oct 7) • [[#53]](https://github.com/farzad-bahadorifar/mehrchain/issues/53)

**Scope:** current frontend/backend releases and an API-level or browser-level regression script limited to the release journey.

**Hand-off prompt:** "Deploy the reviewed backend before the frontend. Record both revisions and the database migration version. On public URLs, use two test accounts on separate devices or clean browser profiles: authenticate, create private and public habits, Spark, sign out/in, check server-backed state, issue/share/accept a chain invite, refresh both sides, send Heart, and delete a disposable account. For each action record the request outcome and a fresh read from the API or database. Repeat one failure case with the backend unavailable and verify no false success."

**Acceptance:** Every critical action passes on deployed services and survives a reload; no `Tester Google`, mock token, local-only habit, or local-only chain appears in the test. Record failures with reproduction steps. Unit-test totals alone do not satisfy this gate.

### R8 — Run the private field test and decide on launch (P0 decision gate, Oct 7–8) • [[#54]](https://github.com/farzad-bahadorifar/mehrchain/issues/54)

**Scope:** 5–10 invited friends/family; no new feature work during the test except blocker fixes.

**Hand-off prompt:** "After R7 passes, invite 5–10 testers in two waves. Ask each to complete account creation, first habit, Spark, sign-out/sign-in, and—where paired—chain invite/acceptance. Record device/browser, where they stopped, exact error, task completion, and whether data survived reload. Use disposable accounts for deletion. Triage P0 data loss/auth/security defects immediately; defer cosmetic feedback. Re-run R7 after every deployed blocker fix."

**Acceptance:** At least two internal accounts and the invited testers exercise the real database flow; all P0 defects are resolved and rechecked. Public v1.0 launch requires a separate go/no-go review. If R7 is not green by October 7, postpone external testing or label it explicitly as a UI-only preview; if R8 exposes unresolved P0 defects, postpone the October 8 release tag and announcement.

### Definition of done and review packet for every assignment

1. State the exact files/configuration changed and the deployed revision, if any.
2. Show the focused automated test result and one direct acceptance check. Distinguish local, staging, and production evidence.
3. Report remaining risks and blocked dependencies without calling them complete.
4. Keep secrets, tokens, OTPs, and database URLs out of the review packet.
5. Leave the change reviewable; do not mark a historical issue complete merely because code exists.

---

## Original v1.0.0 sprint tasks — historical detail

These entries describe completed implementation work and are superseded by the R0–R8 production gates for deciding whether to test or launch.

### Day 1: Bug Fixes (Critical)

| Issue | Task | Priority | Details |
|:-----:|------|:--------:|---------|
| [#30](https://github.com/farzad-bahadorifar/mehrchain/issues/30) | **OTP auto-fill** | 🔴 P0 (Done) | Frontend reads `previewCode` from register/resend response → auto-fills OTP field → shows message: *"Your verification code has been auto-filled. In the future, this code will be sent to your email."* |
| [#31](https://github.com/farzad-bahadorifar/mehrchain/issues/31) | **Account deletion fix** | 🔴 P0 (Done) | Only clear localStorage when backend returns 200. On error: show *"Account deletion failed. Please try again."* Don't clear in `finally` block. |
| [#32](https://github.com/farzad-bahadorifar/mehrchain/issues/32) | **English email template** | 🔴 P0 (Done) | Rewrite Farsi email template in `mail.service.ts` to English. Keep branded dark theme design. |

### Day 2: Profile Simplification
 
| Issue | Task / Action | Priority | Details |
|:-----:|---------------|:--------:|---------|
| [#33](https://github.com/farzad-bahadorifar/mehrchain/issues/33) | ❌ Remove Belly Glow Grid | 🟡 P1 (Done) | Remove color swatch grid (8+ swatches with streak-based locks) |
| [#33](https://github.com/farzad-bahadorifar/mehrchain/issues/33) | ❌ Remove Scroll-on-tap | 🟡 P1 (Done) | Remove scroll-to-bottom animation on mascot tap and "Tap to interact ✨" tooltip |
| [#33](https://github.com/farzad-bahadorifar/mehrchain/issues/33) | ✅ Keep Essential Profile | 🟡 P1 (Done) | Nickname editor + speech bubble, 21-Day Custom Glow unlock (only color reward), Dark/Light/System theme, Sign Out / Delete |

### Day 3: Journey + Duration + Spark

| Issue | Task | Priority | Details |
|:-----:|------|:--------:|---------|
| [#34](https://github.com/farzad-bahadorifar/mehrchain/issues/34) | **Journey simplify & Badges** | 🟡 P1 (Done) | Remove User Profile Card (duplicate). Keep Stats + Heatmap + Archived. Add badge data model with 5 initial badges (First Spark, Chain Starter, 7-Day Streak, 21-Day Master, Kind Soul) using Lucide icons. |
| [#35](https://github.com/farzad-bahadorifar/mehrchain/issues/35) | **Duration options** | 🟡 P1 (Done) | Replace 7d/14d/21d/30d/Custom with: **"Endless Journey"** (`totalDays = -1`) + **Custom** |
| [#36](https://github.com/farzad-bahadorifar/mehrchain/issues/36) | **Spark button** | 🟡 P1 (Done) | Rename "I did it" → "Spark" with Lucide `sparkles` icon + CSS scale/glow animation |

### Day 4: Loading UX

| Issue | Task | Priority | Details |
|:-----:|------|:--------:|---------|
| [#37](https://github.com/farzad-bahadorifar/mehrchain/issues/37) | **Skeleton loading** | 🟡 P1 (Done) | Add skeleton screens for Dashboard, Chain, Journey initial loads |
| [#37](https://github.com/farzad-bahadorifar/mehrchain/issues/37) | **Cold start message** | 🟡 P1 (Done) | After 5s wait: *"Waking up Mero... Free servers need a moment."* |
| [#37](https://github.com/farzad-bahadorifar/mehrchain/issues/37) | **Text shortening** | 🟡 P1 (Done) | Review all UI text. Make everything shorter and minimal. |

### Day 5: Connectivity & Authentication

| Issue | Task | Priority | Details |
|:-----:|------|:--------:|---------|
| [#41](https://github.com/farzad-bahadorifar/mehrchain/issues/41) | **Cloudflare API Proxy** | 🔴 P0 (Done) | Route `/api/*` requests via Cloudflare Pages Function & `_redirects` proxy to bypass Iranian ISP blocking on `*.onrender.com` |
| [#43](https://github.com/farzad-bahadorifar/mehrchain/issues/43) | **Google Sign-In** | 🟡 P1 (Done) | 1-click Google OAuth / ID token login on frontend and backend verification for instant tester access |
| [#38](https://github.com/farzad-bahadorifar/mehrchain/issues/38) | **Articles placeholder** | 🟢 P2 (Done) | Add "Articles — Coming Soon" card in Chain page |
| [#39](https://github.com/farzad-bahadorifar/mehrchain/issues/39) | **What's New** | 🟢 P2 (Done) | Add changelog section in Profile + blue dot on Profile tab for new version |

### Day 6: Landing & Polish

| Issue | Task | Priority | Details |
|:-----:|------|:--------:|---------|
| [#40](https://github.com/farzad-bahadorifar/mehrchain/issues/40) | **Landing page** | 🟢 P2 (Done) | Complete redesign of `docs/index.html` (GitHub Pages), Mero hero section, philosophy, direct PWA/APK download links |
| [#40](https://github.com/farzad-bahadorifar/mehrchain/issues/40) | **Final text review** | 🟢 P2 (Done) | Ensure all text is English, short, minimal. No Farsi anywhere in the app. |

### Days 7-8: User Testing

| Task | Details |
|------|---------|
| **Recruit testers** | 3-5 people (friends/family) |
| **Test full flow** | Register → Verify OTP → Create habit → Spark → Chain invite → Accept → Heart |
| **Collect feedback** | "Is the app understandable? Anything confusing?" |
| **Fix blockers** | Address any blocking issues found |

### Day 9: Launch

| Task | Details |
|------|---------|
| **Tag v1.0.0** | Create release tag |
| **Deployment audit** | Verify frontend, backend, database all stable |
| **Public release** | Announce via landing page |

---

## Post-Launch Roadmap

### v1.1.0 — UX Polish & Micro-Interactions (Target: Late Oct 2026)

| Task | Details |
|------|---------|
| Three.js Spark Button | WebGL particle burst on habit completion. Lazy-loaded chunk (<1MB). (Ref: #20) |
| Real Articles | Chain page articles about kindness, habit chaining, human connection (CMS/Markdown) |
| Badge illustrations | Custom Mero-based badge designs (not emoji) |
| Design system docs | Document tokens, components, theme guide |
| Extended E2E coverage | Expand the release-critical R7 smoke test into broader Supertest/browser coverage, edge cases, and CI reporting |
| PWA `SwUpdate` | Automatic "New version available" notifications |

### v1.2.0 — Accessibility & i18n (Target: Nov 2026)

| Task | Details |
|------|---------|
| ARIA labels | All interactive elements, modals, forms |
| Keyboard navigation | Full tab flow through all pages |
| Motion preferences | `prefers-reduced-motion` media query |
| Color contrast | WCAG AA compliance |
| Multi-language | English + Farsi via Transloco |
| RTL layout | Farsi RTL support |
| RTL layout | Farsi RTL support |

### v1.3.0 — Real Email & Domain (Target: Dec 2026)

| Task | Details |
|------|---------|
| Custom domain | Purchase and configure |
| Resend verified domain | Real OTP email delivery |
| Retire preview-code compatibility | R2 removes `previewCode` from production responses before field testing; remove remaining development-only preview UI and compatibility code here |
| Paid hosting | If user count > 200 |
| Google Play Store | App listing with signed APK |

### v2.0.0 — Beyond Habit Tracker (Target: Q1 2027)

> **The true vision: charity, mindful companion, self-growth, people connection**

| Task | Details |
|------|---------|
| WebSocket real-time | Live chain activity updates |
| Kindness challenges | Community goals and challenges |
| Mero illustrations | Custom animated mascot (replace emoji-based) |
| Charity integration | Link habits to real-world causes |
| Advanced analytics | Personal insights and growth patterns |

---

## Version Milestones

| Version | Date | Key Deliverable |
|---------|------|-----------------|
| **v0.9.0-preview** | Sep 2026 | Initial MVP with habit tracking |
| **v0.9.1** | Sep 22 | Chain backend API + frontend redesign |
| **v1.0.0-rc1** | Sep 27 | Security, SMTP, signed APK |
| **v1.0.0-rc2** | Sep 27 | Loading spinners & anti-spam |
| **v1.0.0-rc3** | Sep 28 | OTP fix, Resend config, invite URL fix |
| **v1.0.0** | Oct 8, conditional | Public launch only after R0–R8 release gates pass; otherwise reschedule |
| **v1.1.0** | Late Oct | Three.js Spark, articles, design system |
| **v1.2.0** | Nov | Accessibility + multi-language |
| **v1.3.0** | Dec | Real email, custom domain, Play Store |
| **v2.0.0** | Q1 2027 | Beyond habit tracker — charity, real-time, community |

---

## Historical test suite status

The counts below were recorded in the earlier roadmap. Re-run the suites and record current counts during R7; passing unit tests do not prove the deployed database journey.

| Suite | Framework | Tests | Suites |
|-------|-----------|:-----:|:------:|
| Frontend | Vitest | 143 | 31 |
| Backend | Jest | 90 | 11 |
| **Total** | | **233** | **42** |

---

## Design Principles (Must Follow)

1. **Minimal** — no clutter, no pressure, no feature bloat
2. **No external emoji** — only Lucide icons or Mero-based designs
3. **English only** — all UI, emails, and user-facing text in English
4. **Short text** — concise, clear, measured words
5. **Support, not competition** — no leaderboards, no streak shaming
6. **Growth in the shadows** — not social media show-off
7. **Kindness first** — the "Mehr" in MehrChain means kindness
