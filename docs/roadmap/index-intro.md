# MehrChain — Active roadmap

<!-- Generated index: node scripts/roadmap.cjs render. Edit this intro or tasks.json, not the generated table. -->

**Start here before development, diagnosis, design or adding tasks.** Each active
row is one independently verifiable outcome. Its card defines inputs, scope,
starting files, steps, acceptance and verification. Do not add vague umbrellas
such as "improve UI", "finish authentication" or "test everything".

## Read first: known facts and why this path was chosen

Read [decision memory](context.md), [workflow](workflow.md) and
[product direction](direction.md). Every card links its applicable D-ID records.

| Known constraint | Consequence for the next contributor |
| --- | --- |
| [D-001: Mero's first color](context.md#d-001) | No custom palette/save before one habit reaches 21 consecutive days. Then the user chooses/names a color. Later slots use a separate ladder. |
| [D-002: Resend email](context.md#d-002) | The recorded domain/sender/configuration prerequisites are not ready. Do not rediscover this as an unexplained OTP bug unless conditions change. |
| [D-003: SMS](context.md#d-003) | Not a current route per the owner. Do not invent a provider-related cause or automatically implement SMS. |
| [D-004: live username](context.md#d-004) | Timeouts block diagnosis; improved UI copy is not a backend repair. |
| [D-008: completion-only support](context.md#d-008) | The owner wants hearts after completion; current send guards do not enforce that prerequisite. T33 defines the gap before T34's two-view design. |
| [D-009: experiences and memories](context.md#d-009) | Finite experiences, joint outcomes and new Endless attempts differ from the current lifecycle. Settle contracts before Journey wireframes or implementation. |
| [D-011: Why and reminders](context.md#d-011) | Timing and platform delivery are not accepted yet. Inventory first; choose an exact schedule and nudge cap, preserving private optional Why. |

Each record identifies source/date, reason, current action, work not to repeat and
reopening conditions. Owner statements, old observations and fresh live tests are
not interchangeable evidence.

## V2 decision and completed outcome

The owner approved V2 on 2026-10-29. Scoped palette/Profile/Badges/Colors designs
closed as T20/T22/T23/T24. Their local implementation is also Done with evidence:

- **T26:** apply V2 interface tokens independently of saved Mero colors.
- **T27:** complete Profile A with real Account, Badges, Colors and Appearance routes.
- **T28:** explicit username cancel/removal and useful save-error feedback; no live-backend repair claim.

Completion evidence is in the [completed ledger](completed.md) and each card.
Home/Chain/Journey specimens did not authorize new business logic. **T29 alone**
owns the actual deployed username diagnosis.

## Working and adding tasks

1. Check [known decisions](context.md), [workflow](workflow.md), active/completed cards and duplicates.
2. Define one observable result. Independent results need independent tasks;
   essential parts of one result belong in its acceptance checklist with evidence.
3. Fill the [template](task-template.json), then use `node scripts/roadmap.cjs add --file <path> --date YYYY-MM-DD`.
   If the decision itself is unclear, use the [question notebook](opportunities.md)
   and ask one concrete clarification. If only the solution/location is unknown
   but the question is bounded, register an analysis task rather than inventing a code path.
4. UI work follows the [wireframe contract](../ui_ux_discovery_plan.md) inside
   **MehrChain's existing design system, shell and components**. Analysis, code and
   target-environment acceptance each have explicit deliverables.
5. Done requires evidence for every criterion and leaves the active queue.
   A later regression becomes a linked bug; previous completion history is preserved.

## History and GitHub Project

- [Completed](completed.md): exact outcomes/evidence outside the active queue.
- [Withdrawn](dropped.md): IDs and removal reasons remain; withdrawal is not Done.
- [Legacy disposition](legacy.md): completed, superseded and withdrawn old definitions with reasons.
- [Pre-V2 registry](../development_roadmap_history_v2_2026-10-29.md) and
  [earlier evidence](../development_roadmap_history_2026-10-29.md): dated history.
- [Product/release policy](policies.md): fixed constraints; removing backlog does not certify release readiness.
- [Decisions](context.md), [direction](direction.md), [future questions](opportunities.md): context separate from execution.
- One executable task maps to one issue. The owner creates issues/Project items;
  local tooling only records URLs. It never creates/closes issues, changes Project
  status, commits, pushes or deploys automatically.
- Do not run the retired `sync-roadmap-tasks.cjs` / `update-github-roadmap.cjs` bulk scripts.

## October 29 request batch and execution order

The [sanitized intake and image map](evidence/owner-intake-2026-10-29.md) assigns
each owner request to exactly one card, T33-T53. The repeated text attachment was
byte-identical and was registered once. No product behavior or UI analysis is
marked complete by adding these cards.

| Workstream (navigation only, not a parent task) | Exact leaf cards | Order |
| --- | --- | --- |
| Completion-only support and Chain views | T33, T34 | Eligibility contract first; then Connect/Show up wireframe |
| Experiences, attempts and pair outcomes | T35, T36, T37 | Experience model -> Endless attempts -> joint outcomes |
| Journey memories | T38, T39, T40 | Entry after T35; solo after T36/T38, shared after T37/T38 |
| Notifications and private motivation | T41, T42, T43, T44 | Inventory first; exact Why/reminder/nudge decisions follow card dependencies |
| Small presentation decisions | T45, T46, T47, T49 | Counts after T33; title/identity/acceptance can be reviewed independently |
| Diagnoses and responsive evidence | T48, T50, T51, T52 | Independent bounded reports/flow review; no whole-app repair umbrella |
| Confirmed sentinel-label bug | T53 | Local Endless label only; independent of proposed domain changes |

**Start with T33** for the support rule; **T35** and **T41** are independent
foundation analyses. T48/T52 can independently investigate reported rendering/update
behavior. A Ready card with unmet dependencies is defined but cannot start yet.
Each UI card names its same-system `index.html`, checklist and version decision;
only an approved result can become a separate implementation card. Pure domain or
technical reports do not need an invented UI.

T29 resumes only when its network blocker changes. T30's existing Profile phone
acceptance remains independent and is not replaced by T51. T31 stays one bounded
P2 Mero interaction study. Future topics use the same intake path. All
project-authored development material, issue/PR text and application copy must be
English; see [contributing](../../CONTRIBUTING.md).
