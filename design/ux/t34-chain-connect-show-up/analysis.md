# T34: Connect and Show up inside Chain

Artifact: `index.html`, version **v0.1**, prepared 2026-11-03 (Asia/Tehran).
Owner decision: pending review of this exact artifact. Local prototype only.

## Result for review

Keep Home, Chain, Journey and Profile as the four global destinations. Inside
Chain, use two local views:

- **Connect:** invitations, acceptance, partner/habit identity, linked own habit,
  details and deliberate disconnect. There is no support action on a relationship
  row merely because the relationship exists.
- **Show up:** actual linked completion cards. Each offers one acknowledgement
  through a heart, subject to T33's event identity and unchanged daily allowance.

Show up opens first in this version. A small activity dot indicates available
completed steps without adding a count or comparing partners. Local view labels
use the T34 card's proposed English vocabulary; the owner has not approved it yet.

The incomplete synthetic partner Noor exists in Connect and has no card in Show
up. Sara's completion is from yesterday at 23:00, while this review represents
the following morning. It remains actionable. Mina's final finite completion
uses the same support action as an ordinary completed step. Already sent support
is grouped in a collapsed “Support you have sent” section. A new successful send
opens that section, showing the filled, disabled heart for that specific event.

## Inputs and source fidelity

Inspected source revision: `cdebac7` plus the current local documentation changes.
No serving revision or phone was inspected for this task. Starting sources:

- `apps/mehrchain-frontend/src/styles.css`: approved light/dark tokens, Poppins,
  34rem shell, spacing, viewport and navigation conventions.
- `apps/mehrchain-frontend/src/app/app.html`: four global navigation labels,
  Lucide icons and the selected Chain appearance.
- `apps/mehrchain-frontend/src/app/features/chain/chain.html`: header, invitation
  placement, active connections, empty state and own-habit support summary.
- `features/chain/components/chain-card/chain-card.html` and `.ts`, under the
  same frontend app: identity, state text, heart, secondary details and disconnect.
- `features/chain/components/invite-section/invite-section.html`: sharing, copy,
  QR and selected public habit. Also inspected shared Chain response types.
- `design/ux/t22-profile-structure/source`: approved V2 Poppins fonts, licenses,
  familiar control shapes and reference presentation.
- `docs/roadmap/evidence/t33-completion-support-gate.md`, **version 2**: actual
  completion event, next-morning support, once-per-event acknowledgement,
  recipient sending-date cap, privacy, stale data and server confirmation.
- Decision records D-005 and D-008; `docs/ui_ux_discovery_plan.md`.

The standalone CSS reproduces the approved colors directly: light background
`#f4f8fb`, foreground `#263243`, white cards, primary `#007e87`; dark background
`#0e1b2a`, foreground `#eff5fc`, cards `#17283b`, primary `#50dfd4`. Border/muted
roles also match source. Hearts use the existing rose emphasis. Cards have 16px
corners like current Chain rows, controls 12px corners and 44px minimum targets.
The two local views use the approved segmented-control idiom. Partner usernames
retain the current `@` prefix; T47's separate identity proposal is not adopted.

Poppins 400/600 is embedded. Actual installed Lucide geometry is bundled, including
the `more-vertical` alias of `ellipsis-vertical`. The real product `mero.png` is
embedded for the no-connections state. It is a static identity asset rather than
the production Three.js animated mascot; no replacement mascot was drawn.

## Current/proposed comparison

The View selector offers Proposed, Current reconstruction and Compare both.
Both frames use the same selected fixture set, theme and width cap. In comparison,
the first frame retains invitation controls above a single list of relationships,
including a heart next to incomplete status. The proposed frame separates those
relationships from completion cards. A heart on a current incomplete row
demonstrates the source gap; it does not authorize that behavior in the proposal.

Current is a reconstruction of the relevant templates, not a pixel capture or
measured live baseline. Inactive receipts, zero received-heart totals and a
non-present incoming invitation are omitted. Their absence is a fixture state,
not a proposal to remove those product capabilities. The active-current selector's
raw `-1d` presentation remains visible; T53 owns that separate label bug. The new
invite destination uses habit names without proposing a duration-label repair.
No scroll-reduction percentage or real-device comparison is claimed.

The standalone review imitates title weight with the bundled 600 font rather
than every production font weight. The simulated app scrolls inside a phone/PWA
frame with its four-item navigation attached below; browser safe-area insets,
actual PWA installation and OS keyboard are not reproduced. The selected width
is a maximum and shrinks to fit a smaller review window. Use a desktop review
window for an exact 320/390/544px frame, then a narrow window to inspect reflow.

## States and paths

| State/path | Proposed behavior |
| --- | --- |
| No connections | Mero empty state points to Connect; invitation entry is available there. |
| Connections but no completion | Quiet empty Show up; relationship rows remain in Connect. No disabled partner-specific “waiting” support cards. |
| Completed today | A completion card has an actionable heart. |
| Completed last night | The same completion is still actionable the following morning. |
| Final finite completion | Ordinary completion card and acknowledgement, without a separate congratulations action. |
| Sending | Target controls disabled with “Sending…” and busy state; no filled heart yet. |
| Send failure | No success state; restrained error, explicit retry, then simulated confirmation. |
| Confirmed | Filled disabled heart is attached to the same event in sent support. It is not a named receipt of incoming support. |
| Daily cap used by another completion | New event remains unacknowledged and disabled with a clear limit explanation. It is never incorrectly shown as Supported. |
| Loading | Neutral skeletons; no actionable completion snapshots. |
| Refresh failed | Refresh explanation and explicit retry; no supportable stale cards. A historical verified completion is different from stale data. |
| Invite/return | Select an own public habit, preview link/QR, return to Connect. |
| Accept/return | Synthetic incoming invitation, native own-habit selector, confirm or return. Newly connected Jules has no completion card. |
| Details/disconnect | Connection details, reason required, optional note, keep or confirm. Choosing the non-disclosing reason clears/disables note. |
| Other main tabs | Minimal context stub with Return to Chain; no unrelated routes are redesigned. |

The synthetic share URL is `https://example.invalid/chain/demo-invite`. Its QR
encodes that same deliberately non-operational URL. Copy/Share show local feedback;
they do not invoke clipboard, a system share sheet, permissions or delivery.
Accept and disconnect are also local transitions, not account operations. The
outer review controls disclose all of these simulations before product interaction.

## Scope and implementation handoff

T33 and T34 are related: T33 provides the event eligibility contract; T34 places
it into a reviewable flow. The owner requested this design work first and deferred
implementation until afterward. No application file, API, schema or existing
earning rule has been changed. No notification delivery is implied by a card.

After the owner selects a version, use T33 F1 (authoritative event-aware API/data
enforcement) and the approved T34 frontend flow to define narrow implementation
outcomes. Plan them together so the UI cannot ship against daily-only heart state.
Event-specific identity/acknowledgement and daily-limit collision responses are
required inputs for the UI. Preserve account/session guards, anonymous own-habit
received totals, detach behavior and daily allowance. Real notification-channel
inventory remains T41; T47/T49/T53 are not silently completed by this mock.

## Validation

See `checklist.md` for executed browser inspection and its limits, and
`decisions.md` for the exact artifact hash and pending owner decision. Preview
success is not server enforcement, notification delivery, deployment or Android
acceptance. The T34 analysis remains InProgress until its version is reviewed.
