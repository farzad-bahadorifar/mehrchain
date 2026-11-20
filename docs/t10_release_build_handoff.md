# T10 — Repair backend shared-module resolution

> This historical record describes the former hosting setup. Production now runs on Deplexo.
> See the [current deployment guide](production_deployment.md).

Priority **P0**: release blocker, ahead of T08 measurements and T09 deployed
acceptance. Registered in the roadmap before editing configuration on October 20,
2026 (Asia/Tehran). No GitHub issue has been created; the owner handles sync.

## Recorded diagnosis

The preceding read-only investigation inspected the authenticated Render dashboard:

- [T06 deployment](https://dashboard.render.com/web/srv-dandihrtqb8s73bi54s0/deploys/dep-dbbr5rhsrm7s739640jg),
  revision `ddee9ff`, and
  [T08 deployment](https://dashboard.render.com/web/srv-dandihrtqb8s73bi54s0/deploys/dep-dbbrq43rjlhs73bpmi70),
  revision `37ba0e3`, both generated Prisma Client v6.19.2 and then failed webpack:
  `Module not found: Error: Can't resolve '@mehrchain/shared-data'`.
- Both logs identify `chain/dto/disconnect-chain.dto.ts` and `mero/mero.service.ts`.
  The former needs shared disconnect constants at runtime; the latter needs
  `meroColorCapacity`. The older calendar import was type-only and was erased.
- Deployment history also listed failed T05 and T07 attempts. Its last live
  revision and the public direct/Pages version responses were
  `67ed08de788ac108ce586b17faabb962fc994ec1`, with the existing timezone contract.
  This is an observation from the investigation, not a new deployment result.
- Current database migration history and the frontend deployment revision were
  not inspected. Render having the source does not make the new APIs live.

## Implemented locally

Added `compilerOptions.baseUrl: "../.."` to
`apps/mehrchain-backend/tsconfig.app.json` only. The existing canonical paths mapping
in `tsconfig.base.json` remains `./libs/shared-data/src/index.ts`.

The installed Nx webpack plugin uses `tsconfig-paths-webpack-plugin` with that
backend app config. Its loader merges inherited paths but, without an explicit
base URL, anchors them at the leaf config directory. It consequently looked for
the shared source below `apps/mehrchain-backend/libs/…`. An explicit workspace-root
base URL gives both TypeScript and the webpack resolver the intended location.

This keeps one shared-source mapping and bundles local shared values through the
existing resolver; it adds no npm package or runtime external. Root/frontend
configuration, runtime constants/functions, webpack entry/output/build identity,
Render build/start commands, Prisma generation and schema readiness are unchanged.
No migration or dependency change is introduced.

## Verification boundary

Configuration inspection used the installed `tsconfig-paths` loader/matcher:

| Observation | Before | After |
| --- | --- | --- |
| Effective base directory | `D:/projects/mehrchain/apps/mehrchain-backend` | `D:/projects/mehrchain` |
| Existing shared paths mapping | `./libs/shared-data/src/index.ts` | Same |
| Resolved shared source | Wrong directory base | `D:/projects/mehrchain/libs/shared-data/src/index.ts` |

Reviewed the installed Nx resolver/externalization code, the shared exports and
the Git diff/whitespace. These are configuration/source checks only. No build,
tests, typecheck, Prisma generation/validation, database operation, deployment,
commit, push or GitHub synchronization was performed by this fix session.

The working tree started clean at `37ba0e3`. The fix remains uncommitted in Changes.
T10's code correction is implemented; build/release acceptance remains open.

## Owner release gate

1. Review the one-line backend config change and run the clean existing release
   build (`NX_DAEMON=false npm run build:backend:release` in a shell appropriate
   to the environment). Confirm both runtime imports are bundled, no unresolved
   `@mehrchain/shared-data` package is required at startup, and record the result.
   The October 18 build does not verify this repair.
2. Before allowing an automatic Render deploy of the fix, establish the actual
   database migration history and follow the existing [T05](t05_review_handoff.md)
   and [T06](t06_review_handoff.md) gates. Build success alone will not satisfy the
   ten readiness probes if required schema is absent. Do not remove those probes
   or add automatic production migrations to get past a failure.
3. Use a current backup, populated-copy rehearsal and compatible recovery plan;
   coordinate old writers and apply only actually pending reviewed migrations
   through the [database procedure](database_migration_procedure.md). The expected
   later additions are the T05 receipt and T06 Mero migrations, but actual applied
   history must determine the release chain. Do not replay the earlier baseline.
4. Deploy matching backend/frontend artifacts, refresh installed PWAs, verify
   startup/readiness and direct/Pages `/api/version` against the intended fix SHA.
   Then exercise existing auth/timezone, private receipt and Mero contracts.
5. Record measured results in the roadmap/T09. Only then close T10 and resume
   T08 latency acceptance; do not confuse a schema/deployment failure with warming.
