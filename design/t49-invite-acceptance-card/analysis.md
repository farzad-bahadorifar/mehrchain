# T49 acceptance review v0.1

Prepared 2026-11-05, Asia/Tehran. Owner selected native plus full summary;
see decisions.md. No product changes.

## Proposed decision

Keep a **native select with a separate full selected-habit summary**. At narrow
widths, native controls can truncate long labels in their closed state; the summary
keeps the full title and duration readable before acceptance. Above it, show the
inviter and their complete habit title plus what linking means. Selection alone
never accepts. The native selector has a visible label and the summary is polite
live content. Accept is explicit; during the simulated request, selection and
duplicate acceptance are disabled. Failure preserves the selected habit.

A visible radio-list alternative is included for review, using native fieldset,
legend and radio inputs. It exposes full labels but makes ten habits a long list.
Native arrow keys and focus are retained after selection. This comparison does
not justify a custom combobox or claim any Android picker defect.

## Source and boundaries

Inspected `apps/mehrchain-frontend/src/app/features/chain/chain.html` and `.ts`
at cdebac7 plus local analysis files, along with Chain service response types.
Current has a native select, explicit acceptance, a quick public-habit creation
path and a broad invalid/expired/already-used error. Its invitation mapping and
success toast formatting belong to T47's proposed shared identity contract.

The current frame reconstructs those relevant interactions and broad error;
the proposal distinguishes loading, expired, unavailable, self-invite and already
connected outcomes. Differentiated copy will require authoritative API reasons;
it must not infer them from a generic network error. Existing backend specific
validation messages are starting evidence, not an approved stable error-code API.
An “already connected” fixture is a current-user connection outcome, not proof
that a shareable invite becomes globally consumed after its first acceptance.

The proposal uses T47's username-without-added-@ label provisionally. If the owner
revises T47, this identity must follow the same resolver. T34 navigation remains
a separate reviewed artifact. Authentication/install continuation is T50.

0/1/10 public-habit fixtures, long titles, create-before-accept, cancel/return,
pending/error/success, expired/unavailable/self/already connected and loading
are included. Creating a synthetic public habit retains its exact typed title
and returns to the invitation without automatically accepting. The quick form
is a flow stub, not a proposed replacement for the full habit-creation editor.
Returning preserves the selection; a real implementation must retain the invite
and handle creation and acceptance as separate confirmed operations.

The preview simulates every operation in memory. The 700ms confirmation is not
a provider performance claim. Neither API success, native OS picker appearance,
actual Android keyboard, real authentication nor installation is verified.

## Fidelity and executed checks

Offline Poppins 400/600, installed Lucide, approved V2 light/dark tokens, existing
Chain card/control shapes and four-tab shell are reused from the T34 resources.
Mero is not inserted into acceptance, matching its absence in that current card.
Current/proposed use the same fixture, width cap and theme. Wider fixture content
wraps; the native selected label may still truncate by platform design.

120 combinations were checked in installed Chrome through bundled Playwright:
320/390/544px × both themes × native/radio × ten scenarios. No app horizontal
overflow or page errors occurred. Radio keyboard change, full selected summary,
pending-not-success, failure/retry with preserved selection, create-without-accept,
cancel and return passed. `preview.png` shows the long-title comparison.
The selected cap shrinks in a smaller surrounding review window. Actual native
Android rendering is not available, and remains explicitly unverified rather
than being represented as a defect. This artifact is awaiting owner choice.

Build: `node design/ux/chain-review-support/build.cjs t49-invite-acceptance-card`.
Fonts/icon licenses: the V2 resources referenced in
`../t34-chain-connect-show-up/THIRD_PARTY.md`. Shared build tooling emits a
self-contained HTML file; no external font or icon request is required.
