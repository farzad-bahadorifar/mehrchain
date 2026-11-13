# T33: completion-only heart eligibility

Review date: 2026-11-03, Asia/Tehran. Version 2, owner clarification recorded.
Scope: local source audit and synthetic calendar checks; no product implementation,
HTTP request, database change, deployment or real-device acceptance.

## Priority and task selection

The active roadmap explicitly says to start with T33 (P1, analysis). It has no
dependencies and defines the support contract required by T34's Connect / Show up
wireframe. T35 and T41 are independent foundation analyses, not prerequisites for
T33. T29 remains blocked on its separately recorded network condition; T30 and
T56 require their own device/environment evidence. This report does not change
those tasks or start T34.

## Conclusion and evidence boundaries

The requested completion prerequisite is absent in the current card action,
frontend service and backend heart write. A fresh, available linked commitment
can receive a new heart even when it has not been completed on its owner's
current date. Authentication, availability, daily allowance and idempotency
already exist; none proves completion.

- **Owner intent:** D-008 and the October 29 intake require hearts to acknowledge
  a completed linked commitment, without pressuring an incomplete partner.
- **Inspected source:** the paths and scenarios below describe the local working
  tree, not whichever revision is deployed on the owner's phone.
- **Executed checks:** 29 existing backend unit tests passed; actual calendar
  helpers were replayed with synthetic UTC and Tehran accounts.
- **Owner clarification, 2026-11-03:** support is a response to an actual partner
  completion. That completion creates a notification/card in Chain. Without a
  completion, no support card appears. The owner used Duolingo as an interaction
  analogy, not as a request to verify or copy that product's current behavior.
- **Explicit late-support decision:** asked whether a completion at 23:00 can
  still be supported the following morning, the owner answered yes. Therefore
  completion-day-only expiry is rejected. A finite goal reached earlier can be
  supported through its actual completion event; goal status alone does not
  create a fresh support opportunity every day.
- **Operational interpretation:** identify the particular completion and remember
  that sender's acknowledgement across dates. Keep the existing recipient-date
  sending allowance and anonymous totals. No additional time-based expiry is
  introduced by this analysis; exact feed layout/history and delivery channels
  remain with their existing design/inventory tasks.

## Source trace

Paths below are relative to the repository root; line references describe the
source inspected for this report.

| Layer | Entry point | Observed behavior |
| --- | --- | --- |
| Card status | `apps/mehrchain-frontend/src/app/features/chain/components/chain-card/chain-card.ts:82` | Displays goal reached, completed today, resting or waiting; goal status takes visual precedence. |
| Card action | Same file, `sendHeart:103`; adjacent `chain-card.html:22` | Blocks pending, stale and already sent only; an incomplete commitment can emit the send event. |
| Page handler | `apps/mehrchain-frontend/src/app/features/chain/chain.ts:164` | Delegates directly to the service; all failures become generic retry copy. |
| Frontend service | `apps/mehrchain-frontend/src/app/core/services/chain.service.ts:408` | Checks that the connection exists and shares pending requests by recipient commitment; does not check completion or stale state itself. |
| Transport and confirmation | Same file, `writeConnection:339` | Sends an empty-body POST for authenticated remote sessions. Updates sent state after a matching server response with `heartSent: true`; the non-production local branch is a simulation. |
| Controller | `apps/mehrchain-backend/src/app/chain/chain.controller.ts:62` | JWT-protected `POST /chain/connections/:id/heart`; passes authenticated account and connection IDs to the service. No client completion flag is accepted. |
| Availability | `apps/mehrchain-backend/src/app/chain/chain.service.ts:240` | Checks ownership through lookup; acquires ordered endpoint/connection locks, reconciles lifecycles, rejects changed endpoints, disconnected, missing, private or archived endpoints. |
| Heart write | Same file, `sendHeart:281` | Derives recipient day, inserts a unique ledger row with duplicate skipping, updates visible connection support only on creation, returns original timestamp on retry. No completion check precedes creation. |
| Durable allowance | `apps/mehrchain-backend/prisma/schema.prisma:247` | Primary key is sender account + recipient commitment + recipient date, independent of link count. |
| Completion truth | `apps/mehrchain-backend/src/app/commitments/commitment-calendar.ts:51` | `isCompletedToday` compares `lastCompletedDate` to the account date; `isGoalReached` is a separate cumulative condition. |
| Completion write | `apps/mehrchain-backend/src/app/commitments/commitments.service.ts:119` | Uses the same lifecycle endpoint locks; updates log, progress and last completion. A reached finite goal cannot receive another completion unless its configuration changes. |
| Lock-time calendar | `apps/mehrchain-backend/src/app/commitments/commitment-lifecycle.service.ts:13` | Samples server time after acquiring habit locks, then reconciles inactivity. |
| Response and expiry | Backend `chain.service.ts:190`; frontend `chain.service.ts:241` | Returns separate own/partner calendars and server completion state. Client expires snapshots at calendar boundaries and refreshes on resume; failed refresh remains stale. |

The prior contract is
`openspec/changes/update-quiet-chain-hearts/specs/quiet-chain-support/spec.md`:
its goal-reached scenario keeps the daily heart available, and it has no
completion prerequisite. Future work must amend that behavior explicitly rather
than silently claiming an existing guard is defective under the older contract.
`openspec/changes/update-habit-chain-lifecycle/specs/habit-chain-lifecycle/spec.md`
also preserves reached finite goals from inactivity archive. A prior-date finite
goal can therefore stay available indefinitely under the present rules.

## Selected eligibility contract

Let A be the authenticated sender, B the recipient and H1 B's linked commitment.
Let E be a real completion of B/H1 that belongs to the active Chain's completion
notification/card. Let D be B's persisted account date at the server action's
lock-time timestamp. D controls the existing sending allowance and visible
received-heart expiry, not whether E occurred today. The sender's date, device
clock, activity on other commitments and A's own completion do not establish E.

For a **new** heart, first require an owned connection with both endpoints
available and public. Require an authoritative completion E for B/H1, not merely
`isGoalReached` or a client completion boolean. A must not have acknowledged E
already. Then apply the existing sender/H1/D daily allowance. A completion from
the previous date remains eligible the following morning. Supporting E on a
later date consumes that later recipient-date allowance; this analysis does not
backdate a send or relax the daily cap. If two different completion cards compete
for the same allowance, no second new heart is saved on D; keep that distinction
separate from an acknowledgement of the first event.

Preserve idempotent acknowledgements of the same E across retries and dates,
without creating another heart, consuming another allowance, changing the original
send time or reviving support. An existing daily allowance used for a different
event is not proof that E was supported. An old goal must never regenerate a
completion card because the calendar changed. Additional time-based expiry is
not part of this contract: an unacknowledged completion remains pending while
the relationship/endpoints remain available. This is a minimal operational
interpretation of the owner's cross-midnight decision, not a separately stated
owner retention duration.
Availability rejection continues to take precedence over retries on detached
links. No global streak, reminder, named receipt or partner popularity is added.

Client policy: without an actual completion, show no support card in Show up.
The relationship itself remains manageable in Connect. Missing/expired calendar
or unknown completion remains pending refresh. A historical completion card is
different from a stale, unverified snapshot. Loading and sending are
different states. Sent state requires confirmation, and an ambiguous network
failure must not be presented as proof that the server wrote nothing. Refresh
before offering a meaningful retry; the durable allowance handles a lost response.

### Owner decision and superseded draft

Version 1 offered a same-day-only recommendation versus repeated daily support
for an already reached goal. That framing was incomplete: the owner clarified
that support acknowledges the completion notification/card and explicitly wants
next-morning support for the previous night's completion. Both the same-day-only
recommendation and automatic daily regeneration are superseded. The rule applies
to every recorded completion, including the final completion of a finite goal;
whether it was day one or the last day does not change support eligibility.

This is a completion acknowledgement, not a separate congratulations feature.
Implementing it requires durable event identity in addition to the current
recipient-day quota. No such implementation has been performed by this report.

## Eligibility table

All rows assume an authenticated owner of the connection and available public
endpoints unless the row says otherwise. Current results are source-derived;
only the executions explicitly listed later were run. “Pending” is a client or
decision state, not a claim that the server queues a heart for later delivery.

| Case | Current behavior | Required/proposed result |
| --- | --- | --- |
| Never completed, current fresh record | Card and service allow request; server can create heart. | Reject new heart; no completion support card. Relationship may remain in Connect. |
| Last completion yesterday; unacknowledged event E, not overdue | Request can succeed, but current send is not associated with E. | Allow acknowledgement of E subject to unused daily allowance and available endpoints, even though `isCompletedToday` is false. |
| Completed today; allowance unused | Server creates one ledger row and returns confirmation. | Allow one heart. |
| Finite goal reached today | Goal status is shown; action remains available. | Allow one heart; final-day completion qualifies. |
| Finite goal reached before D | Available reached goals can receive a new heart every recipient date. | Allow its real, unacknowledged final completion event under the daily cap. Reject a new heart if that event was already supported. Goal status alone is insufficient. |
| Stale/loading/unknown snapshot | Stale card disables action; service can be called directly and server does not trust/read client freshness. | Pending refresh in UI; server independently evaluates current completion. An old snapshot must never authorize a new heart by itself. |
| Send pending through duplicate links | Card disabled; service returns the same recipient-target promise. | Pending; retain shared in-flight state and no premature sent confirmation. |
| Successful send repeated, including lost-response retry on D or a later date | Same-day ledger returns original time; later dates have fresh quota and can produce another heart for the same old completion. | Allow idempotent acknowledgement of the same E, retaining original time without a new ledger credit, extended expiry or toggle. |
| Today's allowance was used for another completion event | Current service returns daily sent state without distinguishing events. | Reject a new send for E while the daily allowance is consumed; never mark E acknowledged merely because another event used that allowance. |
| Network failure with unknown server outcome | No new client success is inferred; page says “not saved” although the server may have committed. | Pending reconciliation; refresh authoritative state, then acknowledge or permit retry if still eligible. Never automatically replay a write. |
| Recipient midnight, sender still on previous date | New daily allowance exists regardless of fresh completion. | Refresh calendars. Preserve pending unacknowledged E across midnight, but do not regenerate an event or reset E's acknowledgement. New allowance alone is not a new completion. |
| Completion and send overlap | Common endpoint locks serialize both; heart does not test completion. | If completion commits first, allow. If send locks first while incomplete, reject without consuming allowance; an explicit later retry can succeed. |
| Either endpoint archived, private or disconnected | Server rejects after lifecycle reconciliation; inactivity can detach first. | Reject, consume no new allowance and do not revive connection. Preserve existing detach/anonymous-total policy. |
| Archive/privacy/disconnect wins before waiting send | Ordered endpoint/connection locks lead to an unavailable-link rejection. | Reject. If a valid send commits first, later detach clears visible support while leaving durable allowance consumed. |
| Reconnect on same recipient date after an earlier send | Fresh acceptance clears visible connection support; ledger remains consumed. A retry reports sent without restoring received count. | Allow idempotent acknowledgement only on the available new link; no new credit, restored support or quota refund. |
| Direct authenticated API call while H1 incomplete | Controller delegates to server's missing completion check; UI can be bypassed. | Reject in server transaction before ledger insertion or support/reward side effects. |

## Synthetic recipient-midnight replay

Synthetic sender A uses UTC; B uses Asia/Tehran; H1 was completed at
`2026-11-03T20:20:00Z` (23:50 for B). Actual repository calendar functions produced:

| Server instant | A date | B date | H1 completed today | Reached finite H1 goal |
| --- | --- | --- | --- | --- |
| `2026-11-03T20:29:59Z` | November 3 | November 3 | true | true when totalDays = currentDay = 1 |
| `2026-11-03T20:30:01Z` | November 3 | November 4 | false | still true for the same finite goal |

The Endless variant has the same completion-date transition, with goal reached
false throughout. A never-completed variant returns completed-today false on
both sides. The computed first boundary is `2026-11-03T20:30:00.000Z`.
This confirms that resetting allowance and identifying a completion are separate
facts. Under the owner's clarification, `isCompletedToday: false` after midnight
cannot alone reject a real unacknowledged E. These were in-process helper checks,
not API/database simulations.

## Additional source audit after the clarification

- `CommitmentLog` in `apps/mehrchain-backend/prisma/schema.prisma:177` already
  records an ID, commitment ID, completion time and account day; its private note
  must not be exposed to create a partner completion card. Logs provide a starting
  point for real event identity, not permission to broadcast historical activity.
- `ChainHeart` has only sender, recipient commitment, sending date and timestamp.
  It cannot prove which completion was acknowledged, nor prevent the same
  completion being supported on two different dates. The old daily key remains
  necessary but is insufficient for event acknowledgement.
- `ChainPartnerCommitment` in `libs/shared-data/src/lib/chain.interface.ts` exposes
  last completion and today's boolean, without a completion-event identity or
  event-specific support state. The POST body is currently empty.
- `ChainNotificationService.notifyChainPartners` updates connection activity rows
  after completion. It does not create a durable completion-card inbox or deliver
  an OS notification. Delivery is best effort; reconciliation must derive valid
  cards from committed completion evidence rather than trusting that update.
  Actual notification channels/delivery remain T41's inventory, not a completed
  capability. The owner's word “notification” does not establish push delivery.

## Gaps and proposed atomic follow-ups

No new task ID, issue or implementation has been created by this report.

### F1: enforce authoritative completion eligibility for new heart writes

- **Confirmed gap G1:** backend availability/idempotency permits incomplete targets
  and cannot associate a heart with a particular completion across date changes.
  The existing quiet-support spec also lacks the new prerequisite.
- **Inputs:** T33 version 2 completion-card and late-support decisions; backend
  Chain service, lifecycle/calendar helpers, completion logs, heart ledger and
  quiet-support spec listed above.
- **One expected result:** no new heart or support side effect can be committed
  for an ineligible recipient commitment, including direct API calls, while
  retries for the same completion retain their original acknowledgement across
  dates and the existing daily cap is still enforced.
- **Scope:** approved spec delta and transactional predicate before new ledger
  creation; use existing endpoint locks and account date, retain daily ledger,
  privacy, detach, quota and reward rules. Add durable sender/completion identity
  and an authoritative eligibility response; assess the required schema/API delta
  and historical-ledger compatibility before implementation. A daily quota row
  for another event must not report this event as supported. Validate that the
  event belongs to the current relationship context; no retroactive notification
  broadcast or disclosure of log notes/private Why is authorized.
- **Verification:** V1-V6 below, focused service tests and a controlled real-DB
  concurrency/integration check. Existing mocked tests do not prove SQL lock order.

### F2: make current Chain heart controls reflect the approved contract

- **Confirmed gap G2:** card distinguishes completed/waiting visually but both
  are actionable; frontend service has no completion/freshness guard or event
  acknowledgement state.
- **Confirmed gap G3:** all page failures become “not saved, retry”, including
  eligibility rejection or an unknown network outcome.
- **Inputs:** approved T33 decision and F1 response/error behavior; current
  Chain card, service, page and shared response type. Implement after F1 or against
  its approved contract; do not design a second eligibility rule.
- **One expected result:** every existing heart entry point consistently exposes
  a real completion card, pending refresh, pending send, confirmed event support
  or useful failure state; without completion there is no support card, and
  incomplete/unknown data cannot initiate a send locally. Next-morning support
  works without making the same event supportable again on subsequent dates.
- **Scope:** shared eligibility interpretation, card/template/service guards,
  event identity, response reconciliation and failure copy. Visual two-view
  navigation, feed presentation and history stay T34. Platform delivery stays T41.
- **Verification:** incomplete method invocation and button click, missing data,
  stale boundary, duplicate target pending, lost response, server ineligibility
  after an apparently eligible snapshot, and server-confirmed sent on reload.

These follow-ups are suggestions for separate implementation cards after the
decision, not hidden implementation work under T33. T34 remains the existing
owner of Connect / Show up layout and must use the approved report.

## Named future verification scenarios

- **V1 — Direct API bypass:** with a fresh authenticated connection to synthetic
  incomplete H1, POST directly to the heart endpoint without opening the card.
  Expect a domain rejection, no new ledger or connection-heart write and no new
  `hasSentSupport` reward side effect. Then complete H1 and retry explicitly;
  expect one heart. Also verify ownership and missing connection rejections.
- **V2 — Completion/send race:** use separate real transactions and barriers to
  force each endpoint-lock ordering. Send-first rejects without consuming quota;
  completion-first succeeds once. A failed send must not roll back already
  necessary lifecycle reconciliation.
- **V3 — Recipient midnight/stale tab:** reproduce the two instants above, with
  a client tab paused before the boundary. Refresh state on resume; a real
  unacknowledged completion remains supportable the following morning despite
  `isCompletedToday: false`. An already supported E cannot receive another heart
  when the date changes. A waiting request uses the post-lock sending date.
  Include sender-only midnight and a daily quota used by a different event.
- **V4 — Duplicate/lost response:** send concurrently across duplicate links,
  drop the successful response and retry explicitly after refresh. Expect one
  ledger record, original timestamp, at most one visible received heart and no
  false success before confirmation. Same-day reconnect must not restore counts.
- **V5 — Unavailability race:** archive, privatize or disconnect either endpoint
  before a queued send wins locks. Expect rejection and no relationship revival.
  In the inverse ordering preserve consumed quota while removing visible support.
- **V6 — Finite outcome:** acknowledge today's final completion and a previous
  night's unacknowledged final completion. Repeat on a later date and verify no
  second support for that E. Goal status without an actual eligible completion
  card must not mint an event. Check unchanged lifecycle handling, private
  own-habit totals, distinct senders, and no partner identities/counts leaked.

## Executed validation and limitations

1. Inspected all layers above and read the existing frontend tests. In
   `chain-card.spec.ts`, the click test deliberately sends with
   `isCompletedToday: false`. The backend send/retry unit test uses a prior-date
   completion. Both corroborate the existing contract rather than enforcing the
   new owner direction.
2. Ran:

   ```text
   node node_modules/jest/bin/jest.js --config apps/mehrchain-backend/jest.config.cts --runInBand --runTestsByPath apps/mehrchain-backend/src/app/chain/chain.service.spec.ts apps/mehrchain-backend/src/app/commitments/commitment-lifecycle.service.spec.ts
   ```

   Result: **2 suites, 29 tests passed**. These existing tests cover baseline
   reconciliation, retry, recipient midnight and detach behavior using mocked
   Prisma. They do not establish new eligibility enforcement or real concurrency.
3. Replayed the actual `commitment-calendar.ts` exports in memory through the
   installed TypeScript transpiler, with the synthetic values above. Six outputs
   matched the displayed completion/goal/date matrix. No maintained source changed.
4. Attempted read-only `npx --no-install openspec list` and `list --specs`;
   the local CLI could not resolve an executable. Inspected repository change
   directories/specs directly instead; `openspec/specs` is absent. No new proposal
   or spec delta is claimed validated.
5. No frontend test suite, HTTP bypass, deployed revision check, actual SQL race
   or Android/PWA check was executed. V1-V6 are future verification requirements,
   not passing results. No product code or tests were modified.

## Review state and acceptance

- A1: report exists and separates intent, inspection, execution and unknowns.
- A2: scenario table incorporates incomplete, completion, prior finite completion,
  stale, pending, duplicate/retry, midnight and unavailability cases, including
  event identity and collisions with the unchanged daily sending quota.
- A3: owner explicitly chose completion-triggered cards and next-morning support
  for the previous night's completion. Recipient-account sending dates, daily cap
  and privacy remain unchanged. No repeated support is created by calendar changes.
- A4: direct bypass, races, stale data and midnight have named verification cases.
- A5: confirmed gaps map to F1/F2 with inputs, expected outcomes and verification.

T33's analysis deliverable is complete with the version 2 decision and gap report.
The owner has not approved a T34 artifact or an implementation. T34's next
wireframe must show no support card before completion, a completion-triggered
card, next-morning support, confirmed event support and no daily regenerated card.
No notification delivery or event-aware backend has been implemented or verified.
