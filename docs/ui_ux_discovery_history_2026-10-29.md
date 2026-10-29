# UI/UX analysis and wireframe contract

Updated: **2026-10-29 (Asia/Tehran)**. Scope: T20–T25 and future analysis tasks
with a UI deliverable. Current task status and priorities live in the
[active roadmap](development_roadmap.md); this document defines how design work
must be delivered. Earlier evidence is preserved in the
[roadmap history](development_roadmap_history_2026-10-29.md).

## Mandatory design-system and context contract

The owner explicitly requires wireframes in **MehrChain's existing design system
and familiar product context**, so decisions can be made by comparison with the
real app. This is a delivery requirement for every UI analysis task, including
future tasks, not a preference that can be discarded for a standalone prototype.

1. **Establish the actual baseline.** Inspect current route templates, shared
   components, global tokens and the app shell. Record the source revision or
   working-tree state and relevant file paths. Use sanitized/synthetic data.
2. **Keep the familiar system.** Reuse Poppins, the installed Lucide icon language,
   existing Mero identity/model, navigation, mobile/desktop-PWA shell, spacing,
   card/input/button dimensions, typography roles, states and theme behavior.
   Prefer actual shared code/assets. A buildless `index.html` is allowed, but
   reconstructed CSS must remain faithful and its deviations must be documented.
   Do not present a different-looking app with unrelated controls as the wireframe.
3. **Compare in the same context.** Current and proposed states use the same
   viewport, sample content, theme and shell. Show the entry point, destination
   and return path. External review controls are allowed; the product preview
   remains inside MehrChain. A different hosting/browser wrapper is not a design
   decision; the experience being reviewed must remain comparable to the app.
4. **Isolate the change under discussion.** For layout analysis, keep approved
   palette/components stable. T20 may propose color/token changes, but show them
   on the same components/screens and label each changed role. A new component
   may be proposed only with a stated problem, current-versus-proposed comparison,
   impact and explicit owner choice; do not silently replace the component system.
   Brand/UI colors stay separate from earned, named Mero colors.
5. **Deliver a usable wireframe.** Provide the short analysis, a versioned,
   independently viewable `index.html`, relevant clickable flows and states,
   current-versus-proposed comparison, decision checklist and known limitations.
   Static screenshots or palette swatches alone are not a completed deliverable.
6. **Review at realistic sizes.** Cover 320/390px, compact desktop PWA, both themes,
   short/landscape/keyboard-constrained content, focus and reduced motion as
   relevant. State which were inspected in a browser and which need real devices.
   Never count an approximation of the current screen as a measured baseline.
7. **Record an exact decision.** Capture task ID, artifact/version, chosen structure,
   palette/component changes, requested revisions and approval scope. Structure A
   is currently the direction for T22; v0.2 colors and full implementation remain
   unapproved. Do not repeatedly ask the owner to choose A/B without new evidence.
8. **Separate analysis from execution.** After the owner approves a specific scope,
   derive linked implementation tasks/OpenSpec deltas with acceptance criteria,
   dependencies, preserved behaviors and device/release checks. Do not create
   duplicate discovery issues or equate prototype completion with shipped code.

Primary references (inspect current content rather than copying this list blindly):
`apps/mehrchain-frontend/src/styles.css`, `src/app/app.html`, `src/app/app.css`,
`src/app/shared/ui/card/card.ts`, `src/app/shared/ui/button/button.ts`, shared Mero
components and the affected feature route. Paths after the first are relative to
`apps/mehrchain-frontend/`.

## Stage and task-type vocabulary

- **D0 Registered:** problem and required decision recorded; no analysis/prototype.
- **D1 Analysis:** baseline, evidence and options being prepared.
- **D2 Initial wireframe:** a visible draft exists; full task criteria may remain.
- **D3 Review/revision:** owner has reviewed part of the draft; named decisions and
  remaining revisions are recorded. A partial preference is not full approval.
- **D4 Approved scope:** exact task/version/scope approved; implementation work can
  be derived. Implementation and target-environment acceptance have separate states.

Distinguish UI analysis, technical diagnosis, feasibility, implementation and field
acceptance. T21-D and T21-UX below are two work scopes under the existing T21/#80,
not new task IDs or issues. Pure technical analysis without UI requires evidence
and a diagnosis report, not an artificial wireframe.

## Current v0.2 coverage and open decisions

The shared artifact is a partial review package, not six completed design tasks.

| Task | Current coverage | Status / missing decision |
| --- | --- | --- |
| T20 | Current/proposed palette on familiar components; component/token specimens | D3: new colors not approved; full audit/mapping remains |
| T21-UX | Account edit/remove and simulated error flow | D2: full availability/conflict/session contract remains |
| T21-D | No live route/build diagnosis in this package | Not started; deferred during the owner's structure-first review |
| T22 | Profile A with linked destinations | D3: A preferred; final visual/scroll/device review remains |
| T23 | Summary entry, dedicated list/filter/details and synthetic scale specimen | D2: full route/data/state contract and owner decision remain |
| T24 | Initial locked/studio preview and simulated save/cancel | D2: second option and complete milestone/slot/persistence states remain |
| T25 | None; displaying the existing Mero model is not an interaction experiment | D0, P2 |

Home, Chain, Journey, Welcome, habit form and the component library in v0.2 are
**context specimens for T20**, not newly approved redesigns or implementation of
their existing feature tasks. Profile entry placement belongs to T22; destination
experience belongs to T21-UX/T23/T24. This division avoids duplicate scope.

## Scope and approval contract

The owner's three mobile screenshots show the welcome/Mero palette, a long Profile
with inline username/password forms and raw `Cannot PATCH /api/auth/username`, and
an expanding badge list above settings. They are qualitative observations, not a
measured usability study or proof of the deployed backend revision. Do not commit
the screenshots' email/name/account data into fixtures or public design artifacts.

T20–T25 are analysis/design tasks first. The owner requested a visible result and
agreement before product implementation. For each task deliver: evidence and
problem definition; wireframes/options; a recommended direction with trade-offs;
then an independently viewable `index.html` prototype and a concise review checklist.
Store prototypes under `design/ux/tNN-<topic>/`, with a README describing how
to open/run them and which data/interactions are simulated. The first structural
draft is retained as [v0.1](../design/ux/t22-profile-structure/v0.1.html); the current
[design-system review v0.2](../design/ux/t22-profile-structure/index.html) follows
the owner's preference for A and request for stronger colors on familiar components.
Colors and implementation are not approved. Poppins/Lucide and the production
Mero model are reused; standalone component CSS follows existing shapes/tokens.
See its [README](../design/ux/t22-profile-structure/README.md) and
[structural analysis](../design/ux/t22-profile-structure/analysis.fa.md).
The current October 25 draft compares current/proposed palette roles on the same
11 screen/component specimens. It is awaiting owner visual review; it
does not complete T20–T24 discovery or authorize implementation. Live T21 diagnosis
is deferred during the owner's requested structure-first review.
Use synthetic users/data, no credentials, live API writes or analytics.
Prefer a self-contained HTML/CSS/JS preview without an app build. T25 may need a
local server for Three.js modules; document that single command and dependencies.

Use clickable flows, not just static swatches. Provide mobile-first 320/390 px,
short/landscape and desktop views, light/dark/system themes, keyboard/focus states,
readable contrast and reduced motion. Show loading, empty, success, conflict and
failure where relevant. Label simulated behavior honestly. Evaluate prototypes on
a phone as well as at desktop widths; record remaining device unknowns.

Record the owner's chosen direction/version and requested revisions in a decision
log beside each prototype. A completed prototype is not a completed app feature.
Create an explicitly approved implementation checklist/OpenSpec delta only after
review; do not migrate/deploy or modify production UI/API merely to demonstrate a
design. T21-D delivers diagnosis, not automatic production repair; it is currently
deferred during the owner-requested structure-first review.

## T20 — Design system, palette and Mero color direction

**Type / priority / stage:** UI analysis + wireframe, P1, D3. Existing draft:
shared v0.2. The v0.1 muted directions were rejected; proposed v0.2 colors are not
approved. Next deliverable: a faithful comparison and explicit token choice/mapping.

- Audit actual shared tokens, typography, spacing, radii, shadows, control states,
  cards, navigation and Mero materials/fallback. Identify inconsistent usage and
  contrast/hierarchy problems; do not assume every existing color must be replaced.
- Explore coherent palette directions against the existing baseline while keeping
  component shapes, typography roles and navigation stable. Show each
  on the welcome screen, a habit card, Profile, buttons/forms and Mero, in both
  themes. Compare warmth, visual interest, readability and suitability for daily
  use; a fashionable swatch alone is not sufficient evidence.
- Separate brand/semantic colors, earned user-selected Mero colors and decorative
  effects. Keep Mero recognizable and named Mero; preserve earned color choices,
  user color names, moods and 3D/static consistency. Avoid color-only status cues.
- Deliver a switchable `index.html` comparison with token/component specimens and
  an approved token mapping/migration outline. No global CSS rewrite before review.

## T21 — Username failure diagnosis and account-edit interaction

**Type / priority / stage:** technical diagnosis (T21-D) + UI analysis/wireframe
(T21-UX), P1. UX draft D2; live diagnosis not started/deferred. T17 owns the existing
account-access implementation, T12 owns deployed compatibility; do not repeat
their migrations or claim that a visual save repairs the API.

- Reproduce availability and save separately. Record sanitized method/path/status,
  response class and frontend/backend build identities; inspect Pages proxy method
  forwarding, deployed controller routes, auth, pending migration/readiness and
  service-worker caches. The screenshot's `Cannot PATCH` suggests a missing route
  somewhere in the serving chain; it does not establish a username validation error
  or a confirmed root cause. Cross-reference T12/T17 and avoid duplicate migrations.
- Distinguish route mismatch, unavailable network/provider, expired session,
  invalid/taken name and stale availability results. Prepare a concrete repair
  plan for the real cause, separately from the visual redesign; any production
  migration/deployment must still follow the release gate.
- Prototype a compact view/edit/save/cancel flow and a deliberate, clearly named
  remove action. Explore an accessible icon/menu or secondary action instead of
  the current underlined action cluster; do not hide removal behind an unlabeled
  icon or make it easy to trigger accidentally. Show that removing a handle keeps
  email/Google access and account data; it is not account deletion.
- Avoid repeated `(optional)` labels. Mark required inputs with `*` plus accessible
  required semantics and a concise legend where needed. Explain an optional field
  only when it affects a decision. Keep real labels, errors and usable touch targets.
- Show pristine/dirty/checking/available/taken/saving/saved/removed/offline/expired
  states with actionable short messages instead of raw HTTP/framework text. Failed
  writes retain input; success follows server confirmation. Cover cancellation,
  concurrent claims and account-switch/stale responses in the implementation plan.
- Deliver a sanitized diagnosis report plus account-edit `index.html` state demo;
  simulated success is not evidence that username saving is repaired.

## T22 — Profile information architecture and full redesign

**Type / priority / stage:** UI analysis + wireframe, P1, D3. A is the owner's
preferred direction. Continue refining A in the existing system; do not reopen
the rejected visual language or treat the preference as approval of all details.

- Inventory identity, username/security, Mero, colors, badges, theme, version,
  logout and destructive account actions. Rank primary/occasional tasks and compare
  current scroll length to the selected A structure on the same viewport. A/B were
  explored in v0.1; retain that record rather than requiring a fresh A/B choice.
- Move editing/security to deliberate subflows rather than permanently expanded
  forms. Present a coherent identity/companion summary, compact entry cards and
  clear hierarchy; fewer pixels alone must not make settings hard to find.
- Include a Badge card linking to T23's dedicated page and a compact color entry
  linking to T24's experience. Preserve system theme, update/help/version access,
  logout and account deletion. Isolate destructive actions from routine edits.
- Deliver a clickable Profile `index.html` with navigation/back, edit/cancel/error,
  keyboard-open and long-name states, plus measured before/after scroll and task
  access comparisons. Use T20's approved tokens and T21's account-edit contract.

## T23 — Dedicated Badge page and scalable discovery

**Type / priority / stage:** UI analysis + wireframe, P1, D2. Initial linked draft
exists in v0.2; no final page/route/data approval or implementation is recorded.

- Replace the full Profile list with one tappable summary card (earned/total and
  selective preview); open a dedicated page with correct back/deep-link behavior.
- Prototype earned/locked details and understandable progress, plus many future
  badges (e.g. 30+) to demonstrate grouping/filtering only where useful. Include
  no badges, unavailable data, long titles and small-screen states.
- Preserve server/evidence-based earning rules, privacy and permanent milestones;
  visual mock badges must be marked as synthetic and must not invent shipped rules.
  Avoid shame-oriented locked copy and color-only differentiation.
- Deliver Profile-to-Badges `index.html` flow, route/state outline and owner choice
  before moving components or implementing new achievement APIs.

## T24 — 21-day milestone and color collection redesign

**Type / priority / stage:** UI analysis + wireframe, P1, D2. One initial draft
exists in v0.2. The second approach, complete state map and owner choice remain;
T06's earning/persistence rules are outside this visual redesign's change scope.

- Explore 2 alternatives for pre-unlock progress, the first earned color and later
  collection/studio states. Make the reward feel considered and attractive without
  forcing celebration, confetti, repetitive text or a permanently tall Profile.
- Retain T06's exact distinction: first slot from one habit's 21 consecutive days;
  later permanent slots from collection days or distinct accepted partners. Do not
  imply a global streak, reset earned colors or change thresholds as part of design.
- Prototype locked/near-unlock/newly earned/empty available slot/full collection,
  naming/edit/select/preview/save/cancel, failure/retry and reload-confirmed selection.
  Preserve arbitrary saved colors/names and separate preview from persisted choice.
- Show accessible controls/contrast in both themes, Mero 3D and static previews,
  readable progress without color dependence, and an optional reduced-motion
  celebration. Deliver clickable `index.html` plus an approved state/behavior map.

## T25 — Mero belly color interaction feasibility and prototype

**Type / priority / stage:** feasibility + interaction prototype, P2, D0. Not
included in v0.2. The existing Mero model in a familiar shell must be retained;
an early 2D overlay/canvas study may simplify rendering but not invent a new mascot
or unrelated product environment. Label any approximation.

- Clarify the intended experience with a simple 2D/canvas prototype first: a finger
  stirs/displaces the color inside Mero's belly and it settles attractively. Compare
  that with a cheaper shader distortion; full fluid simulation is not a requirement.
  Let the owner review feel/amplitude/settling before a Three.js experiment.
- If the direction is approved, build an isolated Three.js proof for welcome/login
  and Profile using the existing Mero silhouette, moods and selected/earned colors.
  Scope hit testing and pointer coordinates to the belly; color must remain inside
  it, with touch and mouse support. This is a local visual effect, not a color save,
  reward unlock, new account state or network write.
- Coordinate with T19: a belly drag must not accidentally zoom/navigate/activate
  controls or trap page scrolling. Define gesture ownership, drag release/cancel,
  pointer capture and multi-touch handling; outside the belly scrolling stays normal.
- Define measurable device/frame-time, load and memory budgets before the 3D spike;
  profile representative low/mid/high devices and long/repeated visits. Assess
  shaders/materials, DPR, resize, animation lifecycle and resource disposal rather
  than using device/GPU labels alone as a capability guarantee. Pause when hidden;
  handle context loss and performance drops without blocking input.
- Preserve reduced-motion preference, constrained-device/static/WebGL-failure
  fallbacks, existing moods and readable color appearance. No hover-only dependency
  or requirement to rub Mero to finish onboarding. Offer the same essential app
  functionality without the effect; reduced motion may use a still/simple response.
- Deliver simple `index.html` first, then a separately labeled optional 3D spike,
  performance evidence, fallback demonstration and a go/simplify/defer decision.
  Production integration requires owner approval of both appearance and cost.

## Recommended discovery order and release boundary

1. Honor the current structure-first request: review T20 colors and refine selected
   Profile A (T22), with T21-UX account flows in the same design system. T21-D remains
   a functional blocker with no repair claim; live logical diagnosis is deferred
   for this design review, not discarded or marked complete.
2. Record the exact T20/T22 visual choices and remaining T21-UX interaction decisions.
3. Refine T23/T24 linked prototypes against the approved Profile/system direction.
4. T25 simple interaction can be explored independently; only commit to 3D after
   the visual direction and feasibility evidence justify it.
5. Agree each implementation scope/version separately. T12–T19 remain active;
   add approved redesign implementation work to the candidate gate explicitly.
   T25 is exploratory P2 and does not silently block v1. Other design packages are
   P1 for discovery; no unseen redesign is treated as approved release scope.

## Template for future analysis tasks

Add a new analytical task only when the owner supplies its topic. Preserve existing
IDs and issue mappings; no T26/new issue is created by this cleanup. Use these fields:

```markdown
### TNN — Topic
Type: UI analysis / technical diagnosis / feasibility
Priority: P1/P2 with reason
Stage: D0–D4; artifact/version if present
Problem and decision to make:
Scope / out of scope:
Existing screen, entry/return path and source component/token references:
Dependencies and preserved rules:
Analysis/evidence required:
Wireframe: design/ux/tNN-topic/index.html (mandatory for UI scope)
Same-system current/proposed comparison and relevant states:
Review checklist / device and verification limits:
Owner decision: task + version + selected scope + requested changes
Implementation handoff: only after that scope is approved; link task/spec and acceptance
```

Every future UI task must follow the mandatory contract above. A shared prototype
may cover multiple tasks, but its README and roadmap must map coverage and missing
work per task. Pure diagnostic outputs must be labeled separately from UI examples.
