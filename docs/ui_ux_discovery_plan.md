# UI analysis and wireframe delivery contract

Updated 2026-10-29 (Asia/Tehran). Status and scope live only in
[atomic task cards](roadmap/tasks.json); this document is the shared delivery rule,
not a second backlog. [Previous discovery definitions](ui_ux_discovery_history_2026-10-29.md)
are historical and superseded by the task dispositions in [legacy.md](roadmap/legacy.md).

## Mandatory design-system and context contract

Every UI analysis must present a clickable `index.html` in **MehrChain's existing
design system and familiar product context**, so the owner can judge it against
the actual application. Pure technical diagnosis has an evidence report instead.

1. Inspect current route templates, shared components and tokens; record file
   paths and source/build state. Use synthetic/sanitized fixtures only.
2. Reuse Poppins, installed Lucide geometry, the real Mero identity/model, four-tab
   navigation, mobile/34rem PWA shell, typography, spacing and card/control shapes.
   Prefer actual code/assets. If standalone CSS reproduces them, document fidelity
   and deviations; a technically separate preview must still look like the app.
3. Show current/proposed using the same frame, theme, data and dimensions. Only
   change the subject of the task. A palette task compares colors on stable
   components; a layout task uses approved colors and components. An unrelated
   replacement UI cannot be used as a shortcut to obtain approval.
4. Show the entry point, proposed destination and return path, plus relevant
   loading/empty/error/success/confirmation states. Simulated saves must be labeled.
   Do not copy mock earning rules, future synthetic badges or fake counts into code.
5. Inspect 320/390px, compact desktop, both themes and short/keyboard-constrained
   content; check focus and reduced motion where relevant. Identify real-device
   unknowns. A schematic baseline cannot support a measured scroll-reduction claim.
6. Deliver analysis, independently viewable versioned HTML, review checklist,
   limitations and a decision log. Swatches/screenshots alone are not enough.
7. Record the exact task + artifact version + approved scope. Done for an analysis
   means that exact deliverable and decision exist; it does not mean production
   implementation. A selected version supersedes extra unneeded design alternatives.
8. Create a separate precise implementation card after approval. Do not leave a
   broad parent partially progressing or mark linked unrelated tasks as Done.

Before drawing reward/account states, read the applicable [decision records](roadmap/context.md),
especially D-001 (first 21-day color gate versus later slots) and D-002/D-003
(unready mail/SMS prerequisites). A familiar-looking wireframe must still preserve
these product rules; a mock cannot quietly unlock an unearned color or imply working OTP.

## Approved V2 and task ownership

V0.2 was approved by the owner on 2026-10-29. Its English review presentation is
[approved-v0.2.html](../design/ux/t22-profile-structure/approved-v0.2.html), with
decision/hash in [decisions.md](../design/ux/t22-profile-structure/decisions.md).

| One completed design result | Owner | Independent code owner |
| --- | --- | --- |
| V2 Aurora palette on existing components | T20 | T26 |
| Profile A information architecture and direct destinations | T22 | T27 |
| Existing-badge summary/list/filter/details design | T23 | T27 |
| Profile-to-color-studio draft/save/cancel design | T24 | T27 |

T27 is one complete Profile navigation deliverable with explicit acceptance
subchecks, not partial implementation of four open discovery umbrellas. Its own
card lists the full scoped result. T28 owns username UI safety/error presentation;
T29 alone owns the actual deployed-route investigation. T21's former mixed scope
is retired. Home/Chain/Journey specimens were palette context, not new logic.
T31 is one bounded 2D belly-interaction review; further 3D work is unplanned.

## Future analysis intake

The [October 29 intake](roadmap/evidence/owner-intake-2026-10-29.md) maps the new
requests/images to T33-T53. None approves a wireframe or implementation in advance.
T34, T38-T40, T42-T47, T49 and T50 name exact same-system HTML deliverables;
domain contracts and technical diagnoses have separately bounded reports.
Dependencies must finish before a dependent design starts. A shared prototype
cannot close several cards without each card's own evidence and version decision.

Follow [workflow.md](roadmap/workflow.md) and the [JSON template](roadmap/task-template.json).
Define one decision/output, its current page and sources, scope/exclusions, steps,
objective acceptance, exact artifact path, verification and approval evidence.
If the decision is unspecified, clarify it before adding an ID. For a large topic,
create independent leaf deliverables; never put an unbounded “analyze/redesign X”
row in the active index. A shared prototype may supply inputs to several cards,
but every card closes its own explicit deliverable with evidence.

## Stable product boundaries

UI color roles and earned named Mero colors are independent. Keep real labels,
validation and request-confirmed success, preserved failed input, deliberate
destructive actions, account/session guards and existing earning/privacy rules.
No production migration, deployment, live defect repair or device acceptance is
established by a successful local HTML preview. Those are separate explicit goals
when required; see [policies.md](roadmap/policies.md).
