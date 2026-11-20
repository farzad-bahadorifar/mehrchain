# Change: T08 bounded access waits and foreground refresh

> This historical record describes the former hosting setup. Production now runs on Deplexo.
> See the [current deployment guide](../../../docs/production_deployment.md).

## Why

Resume events overlap across habit, Chain/inbox and Mero reads. Auth requests can
wait indefinitely, while a temporary session-restore failure offers no recovery.
The warm-up notice also claims a cause that has not been measured.

## Authorization and status

The owner directly requested T08 implementation in Changes, without builds/tests,
commit, push or GitHub synchronization. This documents that authorized scope;
execution and acceptance are left for owner review. No separate approval is needed.

## What Changes

- Coalesce browser resume events; retain session guards and per-resource reads.
- Pause automatic hidden/offline reads; make Mero reads share pending work and
  follow up once when confirmed habits change during that work.
- Bound API waits, track auth/inbox waits, retain drafts and never replay writes.
- Retry persisted-session verification without clearing credentials for a network
  failure; navigate after confirmed auth while habits load in their existing UI.
- Prepare anonymous, bounded, owner-run access probes and a measurement protocol.
  Provisionally keep Pages/Render/Neon; make no measured performance claim.

## Impact

Frontend services/interceptors/onboarding, a local measurement script and handoff.
No backend/API/schema/dependency/migration or provider change. T05/T06 release
gates remain. Live timings, PWA/provider acceptance and any conditional Workers
experiment remain unexecuted.
