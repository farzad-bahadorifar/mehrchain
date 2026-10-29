# Owner intake: support, experiences, memories and mobile presentation

Date: 2026-10-29, Asia/Tehran. This records task intake, not implementation,
wireframe approval, production verification or new device acceptance.

The owner communicates in Persian. All maintained outputs and eventual UI stay
English; only the original marked README poem remains Persian. User-entered
Unicode names/content must remain intact.

## Source and duplicate handling

Two `Pasted text.txt` attachments under attachment IDs
`939bc718-d9db-4b1f-b6c0-2433ca8de24d` and
`b903d287-64db-4677-961c-f7d835d57eee` contain identical bytes:
SHA-256 `a5098f7918fc52874ea174b4dfc961dcc5db7a6fa9045f4dae175404efcc6a4f`.
They form one request batch. No duplicate task set is registered. Twelve images
were reviewed in the owner message, including the two rotated invitation photos.
Raw attachments remain outside this repository; this durable English summary and
synthetic scenarios are the contributor inputs. Do not copy real handles, emails,
private reasons or live invite tokens into public evidence/fixtures.

## Request-to-task ownership

| Owner request / observable result | Exact owner | Follow-up boundary |
| --- | --- | --- |
| Determine whether hearts require completion; define missing eligibility cases | T33 | Contract/gap report, not a server repair |
| Separate connecting from acknowledging showing up in two Chain views | T34 | Same-system clickable HTML; implementation only after approval |
| Define one-time/N-completion experiences versus Endless intentions | T35 | Counting/vocabulary/compatibility decision; UI changes only if justified |
| Endless third-day archive and start-again semantics, with retained past effort | T36 | Attempt lifecycle decision, not a data migration |
| Shared finite completion and Endless absence outcomes | T37 | Joint outcome table including mixed pairs; no directional-status shortcut |
| Compact Journey entry opening Memories with solo/shared destinations | T38 | Navigation wireframe; no long inline history on overview |
| Solo memory list/detail/restart presentation | T39 | Uses the selected experience and attempt contract |
| Shared ongoing/successful/unfinished memory presentation | T40 | Uses T37 outcomes, not a second independent state definition |
| Review actual notification mechanisms, icons, copy and delivery end to end | T41 | Fixed event/platform inventory and gap ledger |
| Optional Why offer after several completed Endless days | T42 | Threshold, dismiss/reoffer and privacy wireframe decision |
| Motivation during absence plus third-day archive notice | T43 | One explicit non-overlapping absence message schedule and wireframe |
| Optional partner-triggered Why nudge, at most one or two reminders | T44 | Choose exact timing/global limit/consent in analysis; old endpoint intentionally disabled |
| Small received-heart total such as +3 | T45 | Aggregate notation/placement only; existing ledger unchanged |
| Home habit title stays on one line responsively | T46 | Readable truncation/full-title access decision, not unreadably small text |
| Chain identification without @; name/email fallback | T47 | Exact fallback/data contract; no incidental email exposure |
| Confirmed sent heart is visibly filled | T48 | Rendered SVG/build diagnosis; source already binds a fill class |
| Review invitation acceptance layout and native selector appearance | T49 | Current/proposed HTML; compare Android native rendering before choosing replacement |
| Review invite arrival for new/returning/existing users with tab/PWA/APK | T50 | Invitation continuation matrix and retained/redesigned flow decision |
| Whole-app responsive inspection for overflow and broken frames | T51 | Enumerated route/state audit; individual evidenced bugs afterward |
| Explain web update notice and test alleged fit regression around Reload | T52 | Version/service-worker/session/viewport report; no guessed cause |
| Screenshot finding: raw -1d on Endless invite selector | T53 | Small confirmed label bug only, no counting/business change |

T29 remains the single live-username diagnosis; T30 remains the five-route Profile
device check; T31 remains the Mero interaction study. None is closed or duplicated.
All new acceptance items start pending. An analysis finishes only its own exact
artifact/report and recorded decision. Approval creates a new narrowly scoped
implementation card, never a hidden checklist under this intake document.

## Image observations and limits

| Image | Sanitized observation | Task coverage / limit |
| --- | --- | --- |
| 1, 12 | Same completed Home card, title on two lines, one received heart | T45/T46/T51; no multi-heart evidence |
| 2 | Another phone shows finite 1/3 completion, a received heart, Completed | T33/T45/T51; device/build not recorded |
| 3 | Chain selector exposes -1d; partner not completed today beside an outline heart | T33/T34/T47/T48/T53; heart availability is inspectable in code, not proved by a still image |
| 4 | Partner completed today beside an outline heart | T33/T48; image alone does not prove whether it was sent |
| 5 | Refreshing daily status / Refresh required plus -1d selector | T33/T51/T53; stale data is distinct from eligibility or saved support |
| 6, 9 | Duplicate finite Home state before completion, 0/3, Complete today | T35/T46/T51; not a separately observed failure |
| 7 | Rotated invite photo with native select overlay and long option text | T49/T50/T51; OS-native picker is a comparison input, not established Android fault |
| 8 | Rotated invite card with long identity/title and constrained selector | T47/T49/T50/T51 |
| 10 | Private chain-ended receipt and empty active list in dark theme | T37/T40/T41/T51; this is an existing in-app receipt, not an OS notification |
| 11 | Web update notice and Restoring your session coexist with Welcome | T50/T51/T52; before/after Reload order and cause of fit issue unknown |

## Inspected source baseline

This is the current working tree, including previously approved local V2 changes,
not a claim about the revision running on either photographed phone. Intake made
no product edits or external writes.

- `apps/mehrchain-backend/src/app/chain/chain.service.ts`: heart ledger/availability
  guards, no completion prerequisite; nudge deliberately rejects; private receipts.
- `apps/mehrchain-backend/src/app/chain/chain-state.ts`: directional partner-goal
  state, not joint completion of both finite endpoints.
- `apps/mehrchain-backend/src/app/commitments/commitment-lifecycle.service.ts`:
  automatic archive applies to unfinished finite and Endless commitments.
- `apps/mehrchain-backend/src/app/commitments/commitments.service.ts`: restore resets
  streak/anchor, retains cumulative progress/history and does not reconnect.
- `apps/mehrchain-frontend/src/app/features/chain/components/chain-card/chain-card.*`:
  @ username, completion state, sent fill class on Lucide host, stale/pending guards.
- `apps/mehrchain-frontend/src/app/shared/components/commitment-card/commitment-card.html`:
  wrapping title, anonymous count shown when greater than one.
- `apps/mehrchain-frontend/src/app/features/chain/components/invite-section/invite-section.html`:
  interpolates `totalDays` plus d directly, explaining the raw Endless sentinel.
- `apps/mehrchain-frontend/src/app/features/chain/chain.html`: native acceptance
  select, correctly named Endless option there, own-habit heart totals and receipts.
- `apps/mehrchain-frontend/src/app/features/journey/journey.html`: overview, calendar
  and inline history; no accepted new solo/shared memory architecture yet.
- `apps/mehrchain-frontend/src/app/core/services/notification.service.ts`: Capacitor
  local schedule, sample-named icon, web success without scheduling, action listener
  reads commitment ID without navigating. Runtime consequences belong to T41.
- `apps/mehrchain-backend/src/app/chain/chain-notification.service.ts` and
  `chain-cron.service.ts`: relationship updates and best-effort lifecycle sweep,
  not proof of remote push delivery.
- `apps/mehrchain-frontend/src/app/core/services/version.service.ts`, `app.html`,
  `features/onboarding/onboarding.html`, `src/styles.css`: update banner, reload,
  session-loading copy and shared viewport shell.
- `core/guards/onboarding-guard.ts`, `core/services/auth.service.ts`,
  `core/services/chain.service.ts` under the frontend app: guarded invitation
  return URL and invitation code handling already exist; T50 audits continuation.

## Execution order and handoff

Begin with T33 (support gate) and independent T35 (experience contract), T41
(notification inventory), T48/T52 (reported visual/update diagnoses). T34 follows
T33. T36 follows T35; T37 follows T35/T36. Journey entry T38 follows T35; solo T39
uses T36/T38 and shared T40 uses T37/T38. T42/T43/T44 use their stated prerequisite
contracts. Independent bounded presentation studies and T53 may proceed separately.
Dependencies in `tasks.json` are authoritative; a Ready card with an unfinished
dependency must wait. There is no authorization here to implement unapproved new
business rules, deploy, change mail/SMS setup or create GitHub issues.

Every UI study follows `docs/ui_ux_discovery_plan.md`: Poppins, Lucide, real Mero,
approved light/dark tokens, existing shell and components, current/proposed in the
same frame, 320/390px and compact desktop, relevant keyboard/empty/error states,
versioned `index.html` and explicit owner decision. No unrelated design system.

## Intake validation

Executed locally on 2026-10-29:

- `node scripts/roadmap.cjs validate`: 32 total atomic records; 21 new cards
  T33-T53. New criteria remain pending, issue URLs empty and statuses Ready with
  explicit dependencies. Existing completion/blocker records were not changed.
- `node --test scripts/roadmap.spec.cjs scripts/check-project-language.spec.cjs`:
  all 9 tests passed.
- English guard: 355 maintained text files checked; the exact original README
  poem passed its preservation check.
- Local documentation-link check: 260 links resolved; Done cards remain outside
  the active queue and historical completion evidence remains present.

No product tests or builds were required for this documentation-only intake.
No wireframes, implementation, deployment, external issue writes or device
acceptance were performed by registering this batch.
