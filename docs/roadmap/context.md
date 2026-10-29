# Decision memory, reasons and known constraints

Updated **2026-10-29, Asia/Tehran**. Read before starting or adding work.
This document explains why the project took its current path; `tasks.json` alone
owns task status. Do not investigate an unchanged known constraint as a new mystery.
Do not treat an old observation as proof of today's live environment either.

Every record states the decision/state, reason, dated source, current action,
work not to repeat and reopening trigger. Owner statements, code inspection,
local tests and historical/live operational observations are distinct evidence.

## D-001

**Subject: Mero's first color gate and the separate later-slot ladder.**

- **Product decision:** before **one habit** reaches 21 consecutive completed
  account dates, custom-color selection, naming and saving are locked. Mero keeps
  its default glow. The Colors page may still show progress.
- The first reward is a **permanent earned color slot**, not a predetermined color.
  Once unlocked, the user chooses from the palette/picker, names the color and saves
  it. Two shorter streaks, completions across different habits or accepted partners
  cannot substitute for that first milestone.
- Later slots come from cumulative account collection days after unlocking or
  distinct accepted partners. A fresh 21-day streak is not required for every
  additional color. Connecting to another person is optional.
- Existing capacity contract: zero before unlock; after unlock,
  `1 + max(floor(collectionDays / 21), ceil(acceptedPartners / 2))`.
  The paths share one ladder and are not added together. The unlock date adds no
  collection day; each later account date counts at most once. Distinct-partner
  counters may already exist, but they unlock no capacity before the first milestone.
- Earned state survives absence, streak loss and habit archive/deletion. Interface
  theme/palette colors remain independent of saved, named Mero colors.
- **Source/date:** explicit owner confirmation in this chat on 2026-10-29; code and
  existing regression inspection: [T06 contract](../../openspec/changes/add-mero-color-collection/specs/mero-color-collection/spec.md),
  [capacity helper](../../libs/shared-data/src/lib/mero.interface.ts),
  [reward recording](../../apps/mehrchain-backend/src/app/mero/mero-rewards.ts),
  [server save guard](../../apps/mehrchain-backend/src/app/mero/mero.service.ts).
- **Current action:** preserve these rules in Mero/Profile work. The V2 screenshot
  used an already-unlocked synthetic account to show the studio, not a fresh account.
- **Do not repeat:** expose the custom palette to a fresh account; award a fixed
  color; introduce a global streak; relock earned slots; change reward thresholds
  as part of visual work.
- **Reopen only when:** the owner explicitly changes reward rules, or a fresh
  reproduction proves UI/API behavior violates this contract. Register that exact bug.

## D-002

**Subject: why public Resend email delivery is not ready.**

- **State:** public email delivery is not accepted as operational. This is a known
  operational prerequisite; removing the provider or repeatedly changing OTP code
  does not create a sending domain.
- **Recorded cause:** the October 21 inspection found no Resend domain and no owned
  active domain. `RESEND_API_KEY` and `MAIL_FROM` were also absent from the inspected
  Render environment. On October 29 the owner reaffirmed the lack of a purchased domain.
  The practical prerequisite is an owned/controlled domain or subdomain with DNS
  access. A suitable domain supplied later need not be newly purchased.
- **Source/date:** [T14 email handoff](../t14_email_setup_handoff.md), live observations
  dated 2026-10-21; owner constraint reaffirmed 2026-10-29. Live settings were not
  re-inspected in this documentation update. No key/domain/account change or purchase occurred.
- The test sender described in that handoff is not evidence of delivery to public
  recipients. A console OTP or successful API response does not prove inbox delivery
  and completed code verification.
- **Current action:** read this before auth/email work. Do not advertise public
  email signup/OTP/reset as verified. A Google route or local success also does not
  establish real login acceptance or replace every email-dependent flow.
- **Do not repeat:** diagnose failed mail to friends as an unexplained OTP UI bug
  while assuming sender readiness; switch providers without a request; present a
  simulated fallback as real delivery; buy a domain or change DNS/credentials from this note.
- **Reopen only when:** the owner supplies DNS-controlled domain access and intent
  to activate email, or new evidence establishes a verified sender/configuration.
  Then register bounded configuration and real-delivery checks with separate outcomes.

## D-003

**Subject: why SMS is not the current fallback.**

- **Current constraint:** the owner stated on 2026-10-29 that SMS is unavailable
  under current project conditions; it is not a ready replacement for email OTP.
- **Certainty boundary:** this is an owner-stated constraint. The exact technical
  or commercial cause, provider, service region, active account and budget are not
  established. This record does not assert that Resend offers SMS or that all SMS
  providers are impossible to use.
- **Source:** direct owner message in this chat; no new provider feasibility study.
- **Current action:** do not treat SMS as an active capability or Ready implementation.
- **Do not repeat:** repeatedly search providers, sign up/buy credits, change login
  to SMS, or invent sanctions/cost/unsupported-number explanations without evidence.
- **Reopen only when:** the owner specifically requests a fresh SMS assessment and
  provider/country/cost/account constraints become clear. Start with one question
  or bounded analysis; implementation follows its result, not a capability guess.

## D-004

**Subject: why the actual deployed username failure remains open.**

- Local controller/client code contains availability and `PATCH username` routes.
  A missing source route is not an established cause of the live failure.
- On 2026-10-29, read-only Pages/Render version/schema requests each timed out after
  20 seconds. No current serving revision or real save response was available.
- **Source:** [probe report](evidence/username-route-probe.md). No real login/save/
  migration occurred. The older `Cannot PATCH` screenshot alone is not a root cause.
- **Decision:** T28 finished only useful error presentation, input preservation and
  deliberate removal. **T29 alone owns the live diagnosis** and remains Blocked.
- **Do not repeat:** reimplement username management/migrations, attribute the error
  to a taken name/Resend/database without a real response, or finish T29 using a demo save.
- **Reopen when:** network access returns or fresh reliable revision/log/response
  evidence arrives. A bounded check of the unblock condition is allowed; endlessly
  repeating the same unsuccessful probe is not. Follow T29 to establish one repair target.

## D-005

**Subject: why Profile V2 was selected and what is complete.**

- Inline forms and full badge/color lists made Profile long. The owner preferred
  A's direct destinations, rejected V1's muted palettes and excessive component differences.
- V2 reused the existing Poppins/Lucide/Mero/component language and was explicitly
  approved on 2026-10-29. Designs T20/T22/T23/T24 and local code T26/T27/T28 are Done
  for their stated deliverables.
- **Source:** [version decisions](../../design/ux/t22-profile-structure/decisions.md),
  [local implementation evidence](evidence/v2-implementation.md), [completed ledger](completed.md).
- **Do not repeat:** reopen A/B without a new problem, invent an unrelated UI,
  alter habit/badge rules to populate a mock, or call local-code completion deployment.
- **Reopen when:** a new product request or reproducible bug appears. Link a new
  precise card to the previous result; do not rewrite earlier approval/evidence.

## D-006

**Subject: why archiving backlog or completing local code does not certify a release.**

- Broad old definitions left the active queue for clarity, not because their
  evidence/constraints disappeared. T05/T06 migrations have historical execution
  evidence; T17 has recorded rehearsal evidence only. Do not infer today's state.
- **Source:** [legacy disposition](legacy.md), [release policy](policies.md),
  [T12 evidence](../t12_release_execution_2026-10-21.md).
- **Do not repeat:** replay applied migrations, claim real Google/OTP/Android
  acceptance from a build, or push a public tag merely to request a test APK.
- **Reopen when:** a specific release/candidate is requested. Inspect actual
  environment/pending work and create one bounded card per evidenced failed gate.

## D-007

**Subject: why cold-start handling and retries are bounded.**

- Historical Render/free-tier and Pages evidence recorded cold starts/timeouts.
  This is a known failure class, not the established cause of every current error.
- Code has bounded safe-read retry. Do not automatically replay writes to hide a
  timeout. Preserve short pending states, retained input and honest confirmation.
- **Source:** [T15 handoff](../t15_access_recovery_handoff.md), historical October 21
  observations; [recent local checks](evidence/v2-implementation.md). Current provider
  policy/pricing was not inspected by this documentation update.
- **Do not repeat:** attribute every 404 to cold start, promise a fixed wake-up
  duration or replay POST/PATCH/DELETE to make an action appear successful.
- **Reopen when:** measurements on a specified route/network/revision prove a new
  problem, or hosting architecture/plan changes. Scope that exact result as a task.

## D-008

**Subject: support acknowledges showing up; reminders are a separate proposal.**

- **Owner direction, 2026-10-29:** a heart supports a partner only after the
  linked commitment was completed. Connecting and acknowledging a completed step
  should become separate Chain views. Support must not pressure someone to act.
- **Source:** owner attachment, summarized and deduplicated in the
  [October 29 intake](evidence/owner-intake-2026-10-29.md). This is new product
  direction, not proof that the current client/server enforces it.
- **Inspected baseline:** `ChainService.sendHeart` validates availability and the
  recipient-day allowance but has no completion prerequisite. `ChainCard` disables
  stale/pending/sent actions, not incomplete commitments. T33 owns the exact gap
  report; T34 owns the two-view wireframe. No implementation is accepted by intake.
- Preserve anonymous own-habit totals, recipient-account dates, idempotent sends,
  server-confirmed success and the non-refundable daily allowance. Resolve how a
  finite goal reached on an earlier date qualifies; do not silently invent a rule.
- **Separate new proposal:** the owner requests an optional, tightly limited
  partner nudge which reminds the recipient of their own Why. Existing quiet-heart
  code deliberately rejects nudges. T44 must resolve timing, consent and a concrete
  shared anti-spam limit before any replacement implementation. A partner must not
  receive the recipient's private Why merely to trigger a reminder.
- **Do not repeat:** treat a rejected old nudge endpoint as a newly discovered
  outage; restore obsolete nudge behavior; send a heart before completion just
  because the current endpoint permits it; expose a named support feed.
- **Reopen/advance when:** the relevant analysis and exact artifact are approved;
  create separate implementation/spec-delta cards with that decision as input.

## D-009

**Subject: finite experiences, Endless restarts and memory destinations need explicit contracts.**

- **Owner direction, 2026-10-29:** finite commitments may represent a one-time
  experience or N completed days, solo or connected to many people. Not everything
  must be called a habit. Endless remains a distinct intention. T35 defines the
  vocabulary/counting contract before changing screens or data.
- The owner requests a compact Journey entry opening memories, with solo/shared
  destinations; shared memories distinguish ongoing, successfully finished and
  left-unfinished experiences. Neutral English labels require review. Long lists
  may scroll inside their destination; do not interpret this as banning all scrolling.
- The requested future lifecycle exempts unfinished finite commitments from the
  Endless absence rule, finishes finite Chains after both linked goals finish
  regardless of order, and preserves unfinished Endless connections as memories
  after two fully missed dates. Mixed finite/Endless links need an explicit decision.
- **Important difference from source:** current lifecycle archives any unfinished
  commitment after two fully missed account dates, including finite ones. Restore
  resets streak but retains cumulative progress; current Chain state is directional
  and follows the partner endpoint. These are not the requested new attempt/joint
  completion model. Do not relabel old code as compliant.
- The owner describes restarting Endless from day one rather than continuing the
  old attempt. T36 must specify a new attempt versus retained history, counters,
  same-date completion and rewards. Keep earned Mero colors permanent (D-001).
- **Source:** [intake and inspected entry points](evidence/owner-intake-2026-10-29.md).
  T35/T36/T37 own contracts; T38/T39/T40 own separate Journey wireframes.
- **Do not repeat:** rewrite the old historical policy as if already shipped;
  migrate/delete history, change finite expiry or revive old links during visual work.
- **Advance when:** owner approves the exact contract/artifact. Add precise
  implementation cards and OpenSpec deltas before changing the existing lifecycle.

## D-010

**Subject: screenshot observations, presentation requests and web update diagnosis.**

- **Source/date:** twelve owner images and duplicated text attachment received on
  2026-10-29; [sanitized intake](evidence/owner-intake-2026-10-29.md) maps every
  request to one card. Images 1/12 and 6/9 repeat a state. Serving revisions, device
  metrics and the sequence before/after Reload are unknown.
- Current code already counts anonymous received hearts, prefixes usernames with
  `@`, wraps Home titles, and binds a fill class on the heart component. The owner
  requests a small `+N` total, names without `@`, a single-line Home title with a
  readable full-title path, and a visibly filled confirmed sent heart. These are
  separate presentation decisions/diagnoses, not evidence of broken persistence.
- Partner responses inspected expose username/name, not email. Name/email fallback
  is part of T47's decision; do not add partner email disclosure as an incidental
  formatting fix or translate stored user names.
- `A web update is ready` is an existing `VersionService`/service-worker update
  notice with Reload/Later. It is distinct from a habit notification. Image 11
  also shows session restoration. No evidence yet ties an update to viewport
  regression, lost authentication or a specific stale build. T52 owns that diagnosis.
- **Do not repeat:** call the native select an Android defect without comparison;
  claim a screenshot proves a deployment/version/root cause; commit raw account
  handles, private Why text or real invitation codes as public fixtures.
- **Advance when:** rendered evidence identifies the exact failing layer or an
  owner accepts a versioned design. Keep T30's Profile device scope separate.

## D-011

**Subject: optional Why collection and absence notifications are not yet an accepted schedule.**

- **Owner request, 2026-10-29:** after several completed Endless days, offer a
  voluntary opportunity to add a personal Why. Remind the owner of their own Why
  during absence; explain automatic archive when the third absence day starts.
- The attachment mentions both one missed day and two missed days for motivation
  reminders. It does not settle a trigger hour, threshold for the Why offer,
  repeat limit, lock-screen content or channel. T42/T43 own those decisions;
  T41 first inventories actual local/in-app/native/PWA mechanisms.
- Why remains optional, user-written and private. Blank/sample reasons never
  qualify. Showing it only to its author is separate from allowing a partner nudge
  (D-008). No automatic text, repeated prompt, public sharing or forced entry.
- Inspect source rather than infer from service names: `ChainNotificationService`
  updates relationship rows; that alone is not OS notification delivery.
  `NotificationService` has native daily scheduling and a web branch that returns
  success without scheduling. Platform parity has not been established.
- **Source:** [intake](evidence/owner-intake-2026-10-29.md) and the named current
  services. No new delivery test or provider setup occurred in this intake.
- **Do not repeat:** promise background PWA delivery from browser permission,
  assume email/SMS readiness (D-002/D-003), or apply an ambiguous absence schedule.
- **Advance when:** a specific schedule/channel/privacy design is approved with
  platform limits and deduplication rules. Register implementation separately.

## Maintaining this memory

When conditions change, append dated evidence and mark the old record superseded
with its replacement decision. Never erase the past or silently turn it into a
current fact. Do not record secrets, tokens, personal phone numbers or credentials.
Every card links applicable `contextRefs`; missing/unknown IDs are rejected. For a
genuinely new area, record truthful context rather than inventing a reason to fill
a field. Original-language records remain recoverable in the [evidence archive](../archives/README.md);
English developer references are authoritative for ongoing work.
