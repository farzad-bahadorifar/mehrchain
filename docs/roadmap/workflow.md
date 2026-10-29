# Task workflow — contract for contributors and AI agents

The registry `tasks.json` is the only status source. `development_roadmap.md`, task
cards and `completed.md` are generated views. Product code is never changed by the
registry tool. Human owner creates GitHub issues/Project items later.

## Project language and contributor entry points

All project-authored developer documentation, task/issue/PR prose, code comments
and application copy must be English, regardless of owner chat language. **Keep
the original Persian poem in the marked README block verbatim.** It is the sole
authored-prose exception. Preserve user-entered Unicode content and intentional
test fixtures; do not translate stored account data to enforce a documentation rule.

`README.md`, `CONTRIBUTING.md`, root `AGENTS.md`, `GEMINI.md` and GitHub Copilot/PR
guidance all direct contributors to the roadmap first. Historical English
references point to recoverable original source records in `docs/archives/`;
those source records do not override current English development instructions.

`node scripts/roadmap.cjs validate` also runs the language check. The standalone
`node scripts/check-project-language.cjs` checks maintained text for Persian-script
prose outside the exact poem, excluding intentional test fixtures and private
backups. It is a guard against known mixed-language drift, not a semantic proof
that every sentence in every language is English. Review the wording too.

## Read the reasons before repeating work

Read [context.md](context.md) and [direction.md](direction.md) before planning or
diagnosing. Each D-ID records the decision/constraint, reason, dated source,
current action, work not to repeat and condition for reopening. Owner statements,
code findings, local tests and historical/live operational observations are not
interchangeable evidence. Missing verified email-domain setup is not a new mystery
in OTP code; unavailable SMS per owner is not proof about every provider.

Before rerunning an investigation, identify what changed since its evidence.
A bounded check for a documented unblock condition is allowed; indefinite retries
and provider/account/config changes without a new scoped request are not a plan.
When a condition changes, append dated evidence and mark the earlier state
superseded; do not erase its rationale or silently promote old observations to today.

## Intake: when the owner says “add a task”

1. Check the applicable D-IDs and known blockers, then search active and completed
   cards for the same behavior. A new failure after
   completion is a new bug linked in inputs/history, not an unrelated umbrella.
2. Choose one type: implementation, bug, analysis or verification. Choose one area.
3. Write one observable goal; state current and expected behavior for a bug, and the
   exact decision/output for analysis. If missing and not inferable, ask one specific
   question before registering. An owner topic whose decision itself is still
   unclear may be recorded once as Q-NNN in [opportunities.md](opportunities.md),
   outside the executable queue, with one clarification/evidence needed and a
   revisit condition. It receives no task ID or issue until bounded.
4. Fill the JSON template. Include files/entry points, minimal reproduction or input
   fixtures, explicit scope/exclusions, ordered steps, objective acceptance checks
   and exact verification commands/manual steps. Add nonempty `contextRefs` with
   actual applicable D-IDs; unknown IDs are rejected. Create a truthful new context
   record for a genuinely new constraint/decision rather than referencing an
   unrelated one or inventing a cause. No secret or real-account fixture.
5. Split work if independent results can fail independently. Use separate tasks for
   diagnosing a live defect and coding a confirmed fix. Checklist items belong to
   one task only when they are required parts of its one deliverable. A parent is
   navigation/grouping, never an executable issue or a way to hide incomplete work.
6. For visual analysis, require an `index.html` inside the existing MehrChain system,
   current/proposed comparison and recorded owner decision. For pure technical
   diagnosis, require sanitized evidence and a cause/repair plan, not a fake UI.
   Not knowing the final file/solution is acceptable for a bounded analysis task:
   give the known starting screen/reproduction/repository area and an explicit
   report/decision goal. Do not fabricate an implementation path before analysis.
7. Add with `node scripts/roadmap.cjs add --file tmp/new-task.json --date YYYY-MM-DD`. The tool allocates
   the next unused T ID, rejects incomplete cards/duplicate titles and renders views.

## Execution and completion

- `Ready`: defined and executable after listed dependencies. `InProgress`: one
  contributor owns the work. `Blocked`: exact blocker **and unblock condition**.
- Start: `node scripts/roadmap.cjs status --id TNN --to InProgress --date YYYY-MM-DD`.
- Record each acceptance result with `node scripts/roadmap.cjs record --id TNN --check A1 --evidence "path or precise result" --date YYYY-MM-DD`.
- Finish: `node scripts/roadmap.cjs status --id TNN --to Done --evidence "completion report path" --date YYYY-MM-DD`.
  Pending criteria, missing evidence and dependency cycles are rejected. This is a
  record of actual verification; the command does not run or invent that verification.
- A local code task's goal explicitly says local implementation; its Done status
  cannot claim production, Google login, email delivery, Android or real-device acceptance.
  If those are required, create a separate precise verification/deployment task.
- Do not extend a task while completing it. A new desired behavior is a new task.
  Preserve its original decision, evidence and issue mapping. Scope withdrawal is
  `Dropped` with a reason; never relabel unfinished work as Done.
- Closed execution/acceptance records are immutable through the CLI. A new finding
  gets a new linked task. Issue URL metadata may be linked later without rewriting evidence.
  Applicable context-reference metadata may be enriched when maintaining the docs;
  it does not change past acceptance, completion evidence or execution dates.

## Issue and GitHub Project handoff

One executable card → one issue. Use its ID in the issue title (`[TNN] Exact result`),
copy goal/scope/inputs/steps/acceptance/verification and link its card. Use
`.github/ISSUE_TEMPLATE/roadmap-task.yml`. Keep issue URL empty until the owner creates
it, then `node scripts/roadmap.cjs link --id TNN --issue https://github.com/OWNER/REPO/issues/N --date YYYY-MM-DD`.
This only records the URL locally; it does not create/close issues or modify Projects.
Copy the card's known-decision references into the issue as well, so an external
contributor sees the domain/mail/SMS/product constraints before working.
Project fields: ID, type, area, status, priority, dependencies. Status changes in
GitHub are reconciled deliberately with the registry, not by old bulk-sync scripts.

## Maintenance

`node scripts/roadmap.cjs validate` checks IDs, definitions, dependencies, issue
uniqueness and completion evidence. `node scripts/roadmap.cjs render` refreshes
the active index/cards/completed ledger. `lastId` never decreases; retired IDs are
not reused. `legacy.md` preserves old issue references without reopening broad tasks.
Supply the current Tehran date with `--date` for mutations; do not infer dates
from the machine timezone. Read-only validation/rendering does not change dates.

`direction.md` describes desired outcomes/horizons, not hidden Ready tasks. A Q note
is closed by conversion to a concrete T card or a reasoned decision to defer/drop;
link its result and retain the note as history instead of leaving duplicate open
work in two places. No new task/issue is created simply to fill out a future vision.
