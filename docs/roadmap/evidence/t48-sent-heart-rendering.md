# T48: confirmed heart remains outline-only

Date: 2026-11-05, Asia/Tehran. Classification: **reproduced local SVG rendering
defect**. Product repair is proposed, not implemented. Phone screenshot/build
provenance remains unknown; this result does not establish what happened on that
device or certify production persistence.

## Finding

The real production-compiled Chain card receives a synthetic successful
`heartSent: true` response. Its button becomes disabled and its accessible label
becomes “Heart sent for this habit today”. The host Lucide element gains
`text-rose-500 fill-rose-500`, and its computed fill is rose. Its nested SVG keeps
`fill="none"`, has no fill class, and the actual path's computed fill remains
none. This occurs in both light and dark, including after reload with the same
synthetic confirmed server response.

The generated Tailwind fill rule exists. This is not a missing template binding
or missing Tailwind class. The dynamic host class does not become an SVG class,
and SVG's own explicit fill prevents inheritance from that host. The shape's
stroke is rose, which explains an outlined colored heart despite sent state.

## Tested build and method

- Source: cdebac7 with local analysis/prototype changes; no product source edits.
- Command: `node node_modules/nx/bin/nx.js build mehrchain-frontend --configuration=production --skip-nx-cache`.
- Build succeeded 2026-11-05 at 12:10:26 UTC (15:40:26 Asia/Tehran). Initial bundle
  743.24 kB. Existing qrcode CommonJS and Browserslist-age warnings were emitted.
- Main: `main-R36C4OKL.js`, SHA-256
  `cadfeef2ff130a3017535f7b717570a4f74bf40597cf9bf3264dd8d816e20871`.
- Chain: `chunk-SNXCSIOD.js`, SHA-256
  `16e246d4f883fdef588db788b39139e8853022ccaca0d1036f77567a0529243e`.
- Styles: `styles-3WJ4XCOH.css`, SHA-256
  `4dd335cf739dbe3abefd2d1d33c2d8393f5ee9960d19ac7cafc1610bd96fbb8a`.

The read-only `design/ux/chain-review-support/production-preview.cjs` serves this
build on loopback port 4186. `t48-probe.cjs` uses installed Chrome through bundled
Playwright, loads the actual /chain route and intercepts every API request. It
creates only synthetic browser-profile state and uses no real token/account.
External requests are aborted. API success/failure and persistence across reload
are fixtures, not evidence of real server delivery or storage. Service workers
are blocked so an older cached build cannot obscure the local result.

The probe records native host/SVG/path attributes and computed fill/stroke/color,
accessible label, disabled state and actual document theme in
`t48-rendered-states.json`. Screenshots `t48-confirmed-light.png` and
`t48-confirmed-dark.png` show the actual compiled component, not a new mockup.
Final execution captured 14 states and no page errors. An initial probe setup
error and too-early pending sample were corrected before the recorded final run.

## Rendered evidence

Each row below was captured in both themes; rose is
`oklch(0.645 0.246 16.439)` in this generated stylesheet.

| State | Host fill | SVG/path fill | Button |
| --- | --- | --- | --- |
| Unsent | default | none / none | enabled |
| Pending, before synthetic response | default | none / none | disabled, Saving heart |
| Failed response | default | none / none | enabled; retryable error |
| Confirmed sent | rose | none / none | disabled; sent label |
| Reloaded confirmed state | rose | none / none | disabled; sent label |
| Diagnostic SVG-only style | rose | rose / rose | remains disabled/sent |
| Stale response calendar | default | none / none | disabled; Refresh required |

The diagnostic experiment injects only into that disposable browser page:

```css
app-chain-card lucide-icon.fill-rose-500 svg { fill: currentColor; }
```

It changes neither the response nor host state, yet makes the actual SVG/path
solid in both themes. It is removed on reload; no product stylesheet was edited.
This isolates a concrete repair target. It does not approve that exact selector
as the final shared design-system implementation.

## Source trace

- `apps/mehrchain-frontend/src/app/features/chain/components/chain-card/chain-card.html`:
  sent color/fill classes bind on the `lucide-icon` host; pending/stale/sent disable
  the button. The corresponding `.ts` computes sent from non-stale server state.
- `node_modules/lucide-angular/esm2020/lib/lucide-angular.component.mjs`:
  creates nested SVG from default attributes and copies the component's class
  input; Angular dynamic host class additions are absent from the captured SVG.
- `apps/mehrchain-frontend/src/app/core/services/chain.service.ts`:
  remote writes validate response ID and `heartSent === true`, then apply confirmed
  state. Failure cannot set sent via that branch; target requests are deduplicated.
- The fresh generated stylesheet contains `.fill-rose-500`. Computed host fill
  confirms it is applied; nested SVG evidence proves why it does not fill the path.

## Proposed atomic repair

Input: this report, raw rendered states and approved T34/T33 event-aware UI state.
One outcome: confirmed support renders a solid readable heart in the actual
production Chain component while unsent, pending, failed and stale remain unsaved.
Target: direct conditional SVG fill via the supported icon interface or a scoped
sent-state SVG rule in the Chain card. Preserve sent color, accessible name,
server confirmation, retry behavior, event eligibility and allowance. Do not
replace Lucide, alter support persistence or reimplement business rules here.

Verification after a separately approved implementation: rebuild production,
repeat both-theme nested SVG/computed-style probe, confirm solid sent after
success and reload, outline unsent/pending/failure/stale, correct disabled states,
and no additional writes from retries. Check the identified phone/build when
available; keep lack of that evidence explicit. T33 owns event-aware backend gaps.

## Acceptance and remaining work

A1/A2/A4/A5 have report/evidence and a concrete follow-up. The solid-sent part of
A3 currently **fails in the inspected product build**; its pending/failure/retry
states behaved as expected in the controlled replay. Do not record A3 as passing
or claim a product fix from the diagnostic style. T48 remains InProgress for this
acceptance gap. No current Android reproduction or deployed revision was tested.
The local cause is now known; further work should use this report rather than
repeat the same investigation without changed evidence.

## Owner scope approval — 2026-11-05

The owner explicitly approved the limited SVG-fill repair for the later
implementation phase, including rerunning sent/pending/failure states in both
themes. This approves the repair scope, not a claim that A3 now passes. Product
files remain unchanged and T48 stays InProgress until its actual rendering
acceptance is met. UI selections T34/T47/T49 are documented in their decision logs.
