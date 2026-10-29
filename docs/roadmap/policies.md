# Product and release constraints

These are stable requirements, not executable tasks. Retiring a broad old task does not declare these gates passed.

## Explicit Mero color acceptance boundary

The owner reconfirmed this on 2026-10-29; read [D-001](context.md#d-001) before any
Mero/Profile change. This is the existing product contract, not a new feature task.

- A fresh account has zero custom-color slots and the default glow. Showing progress
  is allowed; exposing custom palette/name/save controls before eligibility is not.
- One habit must reach 21 consecutive completed account dates. The permanent first
  reward unlocks a **user-chosen** color, not a fixed assigned color. The user can
  choose from presets/the picker, name it and save it.
- Later slots use the separate collection-day/distinct-accepted-partner ladder;
  do not require another first-milestone streak for every color. Both paths share
  capacity, not additive rewards. See the exact existing formula/sources in D-001.
- Earned slots survive absence, streak loss and habit archive/deletion. Preview is
  separate from confirmed selection. UI theme/palette never changes earned Mero colors.
- Locked/unlocked/failed-save/cancel are meaningful review states. An unlocked
  synthetic fixture is not evidence that a fresh account may select a custom color.

## Known access/delivery prerequisites

Read [D-002](context.md#d-002), [D-003](context.md#d-003) and [D-004](context.md#d-004).
No owned/verified sending domain and sending configuration were available in the
recorded Resend setup; the owner reconfirmed lack of a purchased domain. SMS is not
an available current route per the owner; its detailed provider constraint is not
diagnosed. Do not invent one. These are reasons to check prerequisites before auth
work, not permission to acquire a domain/credits, change providers or fake delivery.

## Preserved product rules

These rules are preserved from the previous roadmap. Visual changes do not authorize changing them.

**October 29 requested changes are analysis inputs, not shipped behavior.** Read
[D-008](context.md#d-008), [D-009](context.md#d-009) and
[D-011](context.md#d-011) before using the baseline below. The owner now wants
completion-only hearts, finite experiences that do not disconnect for absence,
joint finite completion, distinct restarted Endless attempts and bounded optional
nudges. T33/T35/T36/T37/T43/T44 settle the exact changed contracts. Preserve old
evidence; record approved deltas and precise implementation tasks instead of
quietly changing this historical baseline or assuming code already complies.

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

Implemented in T02/T03: persisted account IANA timezone; no missed-day penalty for a partial creation/restore date; Custom counts completed days; finite goals offer Continue or Archive when reached. Existing accounts/history retain UTC, and signing in or changing device timezone does not change an account's zone. The October 18 migration preserved those historical fields and UTC defaults. On October 20 the owner selected T06 scenario C: first earn a permanent color slot through one 21-day habit streak, then earn more shared slots through completed account dates or distinct accepted Chain partners. The precise contract is preserved in the historical T06 section (development_roadmap_history_2026-10-29.md) and its OpenSpec delta; this is not a global streak or an obligation to connect.

Implemented in T04: one sender per recipient habit per recipient account date, regardless of multiple links. A send is idempotent and never toggles off on retry. Disconnect/archive/private changes clear visible support, but do not refund that day's allowance; reconnecting the same day cannot revive the old support. Sent state follows the partner habit's calendar; own received counts follow the own habit's calendar. T05 retains this distinction: disconnect receipts do not read or modify the daily allowance ledger.

Implemented in T05 (`ed38dd6`): an explicit manual reason, Cancel, private preview and optional 500-character plain-text explanation; one durable partner receipt in the reciprocal-disconnect transaction; generation tokens for safe reconnect/retry; neutral lifecycle receipts; a recipient-only pending inbox with explicit saved dismissal. Prefer not to share stores no explanation. These are implementation facts from source review, not executed acceptance results.


## Release gate

Before a public release: inspect actual frontend/backend revisions and pending migrations; preserve current data with the existing snapshot/rehearsal procedure; run current standard checks; verify real account/email/PWA flows required by the announced scope; build a fresh signed Android candidate with matching versions and increasing versionCode, verify certificate/checksum and same-key upgrade. Tag only the accepted commit. No automatic production migration or public tag is authorized by local-code completion. Old T12–T19 notes remain historical evidence, not current environmental facts. When release work is requested, create bounded cards for the specific failed gate after inspecting its actual state.
