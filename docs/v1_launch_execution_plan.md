# V1 launch execution plan — historical English reference

Original review: **2026-10-05**, owner-requested deadline **2026-10-06**, Asia/Tehran.
This is a historical summary, not the current release plan or current provider
configuration. The original record, including its later notes, is preserved under
`docs/v1_launch_execution_plan.md` in the [source archive](archives/README.md).
Start new work from [the active roadmap](development_roadmap.md) and its known decisions.

## Decisions and constraints recorded then

- PWA target: `https://mehrchain.pages.dev`; Android APKs built by GitHub Actions
  were intended to use the same real Render backend/database.
- Email/password with Resend OTP had been the intended initial access path.
  Without an owned verified sending domain, delivery to independent pilot inboxes
  was blocked. The proposed initial test path was real Google sign-in on PWA;
  that proposal itself was not proof of configured/accepted login.
- The owner had no separate domain/host. Existing Render/Pages/Neon hosting did not
  require a separate hosting purchase; public transactional email still needed a
  controlled sending domain. Current interpretation and reopening conditions are D-002/D-003.
- A Chain connects two habits. One habit may have multiple partner-habit links.
  The proposed invitation model was one reusable link per habit, independently
  accepted by multiple people until expiration/revocation, rejecting self/duplicate pairs.
- Desired support: completion visible to linked supporters; each sends one quiet
  heart; the owner sees received support separately from sent support.

## Historical inspection and verification boundaries

The owner-created Google client origins were inspected; `GOOGLE_CLIENT_ID` was
saved in Render without starting a new deployment at that step. The dashboard
showed a Blueprint-managed Free Frankfurt service on main and a September 19 live
revision `80994ce8035242c240427283dd646ddc461c3689`. Those values are dated evidence.
The backend output/start path was reconciled to `node dist/mehrchain-backend/main.js`.
Current release commands must be taken from current source and policy, not this note.

Local reviewed revision was `16d37b8`. Frontend/backend tests and production builds
passed in that review; the frontend count was 148 tests across 31 files. The local
build had no Google client ID, which did not establish dashboard environment values.
Direct/proxy public probes failed to connect in that session, so no HTTP status
or live acceptance was inferred. Production database state was not reverified by
that initial review. Generated call-graph traces were incomplete and were checked
against source; they were not comprehensive security/feature certification.

## Core gaps identified at that time

The record identified separate received-support evidence, partner activity direction,
streak gaps, recovery from resting/fading after completion, consistent calendar/cron
behavior and Android origin/API compatibility as items needing actual acceptance.
The then-current UTC day and free-service/process scheduling assumptions were not
to be confused with later account-calendar implementation or current hosting policy.

## Operational discipline and later records

Dashboard screenshots were point-in-time evidence, not continuing authenticated
access. Credentials were never to be placed in frontend source/chat/logs. Database
targets required verification, snapshot/rehearsal and the isolated migration process.
Service-level tests were not real Google/HTTP/two-account acceptance. A tag that
publishes a public release was not a harmless way to ask for a test APK.

Later execution is summarized in [the October 6 handoff](v1_test_and_release_handoff.md)
and detailed in the English [subsequent roadmap history](development_roadmap_history_2026-10-29.md).
Exact original dashboard identifiers, commands, access observations and later
updates remain recoverable in the archived source. They are not today's task queue.
