# T34 v0.1 review checklist

Date: 2026-11-03, Asia/Tehran. All data/actions are synthetic.

## Owner review

- [ ] Accept, revise or defer **T34 v0.1** as identified in `decisions.md`.
- [ ] Review Show up as the initial local view and the Connect / Show up labels.
- [ ] Review the completion card, yesterday's completion and sent-support group.
- [ ] Review invitation entry/return and connection details/disconnect placement.

These are design review items. They have not been marked passed for the owner.

## Browser verification

Executed with the installed Chrome browser through the bundled Playwright runtime,
headless on Windows; screenshots were then visually inspected. No test framework
or dependencies were added to the repository.

- [x] Offline build: 656 KiB standalone HTML, embedded Poppins/Lucide/Mero/QR;
  bundled script parses successfully. Built page makes no external requests.
- [x] Loaded the direct `file:///D:/projects/mehrchain/design/ux/t34-chain-connect-show-up/index.html`
  artifact and switched from Show up to Connect without a server.
- [x] Default three completion events are present; the incomplete partner has no
  completion card. Four connections remain manageable in Connect.
- [x] Yesterday's event: sending state is disabled/unfilled before confirmation;
  confirmed state is disabled with a computed non-empty SVG fill.
- [x] Invite/QR/return, incoming acceptance, new connection, details and disconnect
  work locally. Non-disclosing reason disables and clears the optional note.
- [x] Failure has an alert without sent state; an explicit retry succeeds.
- [x] Failed refresh exposes no actionable stale cards; explicit refresh recovers.
- [x] A second event with consumed daily allowance stays disabled/unsent.
- [x] Arrow-key and Home navigation preserve selected tab and actual focus.
  Decorative activity dot was corrected to avoid changing the tab's accessible name.
- [x] **396 responsive state combinations** measured without document/app horizontal
  overflow: outer viewports 320/390/1024px × light/dark × selected frame caps
  320/390/544px × eleven scenarios × Connect/Show up. Frames shrink to available
  width in smaller outer windows; exact selected frame widths fit at desktop sizes.
- [x] Short 390×540px viewport, reduced-motion preference and Escape return from
  invitation were exercised. This is not a native software-keyboard test.
- [x] Captured and visually inspected `preview-light.png`, `preview-connect.png`
  and `preview-comparison-dark.png`. The dark comparison shows both variants
  simultaneously at the same 390px cap with matching fixtures.
- [x] Browser interaction/responsive run reported no page errors or external
  requests. `node scripts/roadmap.cjs validate` passed; whitespace check passed.

## Manual exploration

1. Open `index.html` directly, or run `node preview.cjs` and open
   `http://127.0.0.1:4184`.
2. Keep Proposed / Completions & connections selected. Show up contains Alex's
   completed step and Sara's 23:00 completion from yesterday. Noor has no card.
3. Send Sara a heart. During the delay it is not filled. After confirmation,
   open sent support and inspect the filled disabled heart for that completion.
4. Switch to Connect. All four relationships, including Noor, are visible without
   support buttons. Open an invitation, QR, accept an invite and return. Jules
   becomes a connection without an invented completion.
5. Open connection details. Try canceling disconnect, choosing a reason and a
   private note, then the non-disclosing choice. The note is cleared/disabled.
6. Select First send fails. Send, inspect failure without success, and retry.
7. Select Refresh failed. No stale cards can be supported. Retry refresh.
8. Select Daily allowance used. Sara's new completion is not falsely shown as
   supported merely because her previous event consumed today's allowance.
9. Select No connections, One connection, No new completions, Many connections,
   Long names & titles, Loading and All completions supported.
10. Compare both frames with the same width/theme/fixture, including the current
    incomplete-row heart. Explore 320px, 390px and 544px PWA shell in both themes.
11. Tab to the Chain views; use Left/Right/Home/End. Check visible focus, native
    selects, invitation return, Escape return and reachable sent-section summary.
12. Use a short window to scroll forms above navigation; turn on reduced motion.

## Limits

No actual Android/PWA, native keyboard/select sheet, OS push, clipboard, system
share sheet, network send/retry, database concurrency, screen reader, deployment
or account changes are verified by this artifact. Full keyboard-only coverage
and assistive-technology acceptance remain manual review work.
