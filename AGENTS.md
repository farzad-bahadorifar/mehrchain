<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

## Atomic roadmap workflow

**Roadmap first; English-only project material.** Before editing code, diagnosing
bugs, proposing UI or adding tasks, open `docs/development_roadmap.md` and follow
its reading order. All project-authored documentation, task/issue/PR prose, code
comments and application/UI copy must be English, regardless of chat language.
The sole authored-prose exception is the original Persian poem in the marked
README block; preserve it verbatim. `node scripts/check-project-language.cjs`
checks that exception and rejects Persian-script prose elsewhere in maintained files.
Preserve user-entered Unicode data and intentional test fixtures; this policy is
not permission to rewrite account names or stored content. Original-language
historical evidence is retained only in the documented archive, with English
references for ongoing work. See `CONTRIBUTING.md` and `docs/roadmap/workflow.md`.

For every task request, read `docs/development_roadmap.md` and
`docs/roadmap/workflow.md`, `docs/roadmap/context.md` and `docs/roadmap/direction.md`.
Read applicable D-ID records before diagnosis, especially email/domain/SMS and
Mero reward gates. Never repeat an unchanged known blocker as a new mystery or
invent its cause. Historical observations are dated, not current-live proof.
Use `docs/roadmap/opportunities.md` for owner topics whose decision is not yet
defined; they are not executable tasks or issues. The canonical registry is `docs/roadmap/tasks.json`;
use `node scripts/roadmap.cjs` to add/validate/render/record status. Do not insert
vague umbrella work or completed tasks into the active index. Each task needs one
observable goal, exact scope, starting files, steps, acceptance and verification.
UI analysis must follow `docs/ui_ux_discovery_plan.md` in the existing MehrChain
design system. The owner creates GitHub issues/Project items later: do not create,
close, sync, commit or push them merely to maintain the roadmap. This current
owner direction supersedes the older bulk lifecycle instructions in GEMINI.md.
