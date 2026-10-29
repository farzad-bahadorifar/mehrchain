# MehrChain contributor and AI-agent instructions

Read `docs/development_roadmap.md` **before** development, diagnosis, UI analysis,
planning or adding tasks. Then read `docs/roadmap/workflow.md`, the applicable
D-ID records in `docs/roadmap/context.md`, and `docs/roadmap/direction.md`.

- Use English for project-authored docs, task/issue/PR prose, comments and UI copy,
  regardless of chat language. Preserve the original Persian README poem verbatim;
  it is the sole authored-prose exception. Preserve user data and intentional Unicode fixtures.
- Work from one precise task card with explicit scope, exclusions, inputs, steps,
  acceptance and verification. `docs/roadmap/tasks.json` owns status; use the local CLI.
- Read known domain/mail/SMS, Mero reward and release constraints before diagnosing.
  Do not invent causes or retry an unchanged known blocker indefinitely.
- UI wireframes must use the existing MehrChain design system and familiar shell;
  read `docs/ui_ux_discovery_plan.md`.
- Do not equate local code/build success with live service or device acceptance.
- Keep future undefined owner topics in the separate question notebook, not the
  executable queue. Preserve decisions and completion evidence.
- The owner creates GitHub issues/Project items later. Do not create/close/sync them
  or commit/push/deploy merely to maintain task records. Never run retired bulk-sync scripts.

Root `AGENTS.md` and `CONTRIBUTING.md` are the shared project entry points. Old
historical handoffs are evidence, not a competing current backlog.
