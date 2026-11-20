# T08 review handoff

> This historical record describes the former hosting setup. Production now runs on Deplexo.
> See the [current deployment guide](production_deployment.md).

Prepared October 20, 2026 (Asia/Tehran). The working tree was clean; T07 already
existed in local commit `023b42d`. Its push/deployment state was not queried.
T08 is left uncommitted in Changes for owner review and GitHub synchronization.

## Implemented

- One 200 ms foreground-event source for habit, Chain/inbox and Mero refresh.
  Pending same-session reads are shared. Chain no longer starts an inbox refresh
  again before checking its pending connection read. Automatic habit/Chain expiry
  and Mero refresh defer while hidden/offline; expired support/calendar stays stale.
- Mero shares collection loads and follows a habit change during a read/save with
  one deferred refresh. Existing user/token/generation checks and confirmed saves
  remain; account changes clear pending state. Existing color import/write rules,
  heart allowance, receipts and account timezone are unchanged.
- A scoped API interceptor bounds inactive requests at 90 seconds and tracks waits
  through success/error/cancellation, including auth/inbox. Startup reads use the
  same allowance; existing shorter Mero mutation deadlines remain. No automatic
  write replay: an uncertain outcome asks for refresh before retry. Dismissing the
  neutral waiting notice no longer decrements the actual active-request count.
- Explicit persisted-session retry shares pending verification and preserves
  credentials after temporary failures. 401/403 still signs out. Confirmed auth
  starts habit sync in the background so existing guarded loading/retry UI can
  open immediately; the invitation continuation and onboarding drafts remain.
- Owner-run [probe script](../scripts/measure-access-latency.cjs), protocol below,
  focused regression source, OpenSpec change and local future-sync task text.

No backend, proxy, schema, migration, dependency or hosting change. T05/T06 release
gates remain prerequisites for matching deployments. No production access or
database probe was executed. Only source/format/diff/whitespace review was done;
no build, tests, typecheck, OpenSpec validation, Prisma, deployment, commit, push
or GitHub issue/board synchronization. Added test source is **unexecuted**.

## Owner measurement protocol

1. Establish matching intended frontend/backend revisions and applied T05/T06
   migrations first. A failed readiness/DTO/revision check is a release defect,
   not cold-start evidence. The script checks the version contract and revision;
   compare its revision to the intended deployment yourself.
2. On each desktop/mobile and relevant direct/VPN network, record browser/device,
   anonymous network label, revisions and time to first usable action. Never attach
   raw HARs, auth headers, JWTs, emails, invite codes, receipt text or account dumps.
3. Run one target per invocation. Examples (Node 22, dependencies already installed):

   ```powershell
   node scripts/measure-access-latency.cjs --target direct --phase idle --network desktop-vpn --samples 1
   node scripts/measure-access-latency.cjs --target direct --phase warm --network desktop-vpn --samples 5
   node scripts/measure-access-latency.cjs --target proxy --phase idle --network desktop-vpn --samples 1
   node scripts/measure-access-latency.cjs --target google --phase warm --network desktop-vpn --samples 5
   node scripts/measure-access-latency.cjs --target database --phase idle --network desktop-vpn --samples 1
   ```

   These are separate experiments. Before each independently idle direct/proxy
   trial, leave Render without inbound traffic for at least its idle window and
   confirm provider state. A direct request wakes the same backend used by Pages;
   the next proxy request is no longer an independent idle sample. Disable other
   clients/polling during the idle window. There is no keep-alive loop in this tool.
   Phase is an operator label, never detected/proven by the script. Warm samples
   are sequential within one process, not concurrent load. Repeat idle trials;
   report individual outcomes, warm median/range and failures, not only best cases.
4. Database mode needs `T08_DATABASE_URL` supplied privately in the process
   environment (never paste credentials into a committed command/output). It
   measures connection setup separately from read-only `SELECT 1` on that same
   connection, then closes it. Run after independent database idle too; prior API
   traffic can already have woken Neon. It does not measure Prisma pool reuse or
   transactional writes from Render, and cannot be subtracted from API time to
   produce a valid backend breakdown. Use sanitized backend timings for that.
5. Google script reachability is only a network component. On mobile use the real
   browser/PWA and record script load, chooser interaction separately, backend
   `/auth/google` exchange, `/auth/me`, `/commitments/sync`, `/chain/connections`,
   `/chain/disconnect-receipts` and `/mero/collection`. Time API calls without
   exporting payloads/IDs. Script mode does not prove real provider login, mail
   delivery, browser DNS/TLS/CORS or device latency.

| Evidence | Current outcome |
| --- | --- |
| Independent idle/warm direct API and Pages latency | Not run |
| Database connection/query and backend-origin transaction timing | Not run |
| Desktop/mobile, direct/VPN and Google/returning-session first usable action | Not run |
| Foreground overlapping requests, hidden/offline recovery and PWA | Source implemented; runtime not run |
| Measured before/after improvement | Not established |
| Workers representative experiment | Conditional; not run |
| Hosting decision | Provisionally keep Pages/Render/Neon; final measured acceptance pending |

## Provider review and decision

Official documentation reviewed October 20, 2026:

- [Render Free](https://render.com/docs/free): idle spin-down after 15 minutes,
  wake-up around one minute; 750 shared free instance hours per workspace/month.
  This explains a possible delay, not a measured diagnosis of this deployment.
- [Neon scale to zero](https://neon.com/docs/introduction/scale-to-zero): Free
  compute suspends after five inactive minutes; documented reactivation is usually
  hundreds of milliseconds. Endpoint/account behavior still needs measurements.
- [Workers limits](https://developers.cloudflare.com/workers/platform/limits/):
  Free lists 100,000 requests/day, 10 ms CPU/request and 128 MB memory. Network
  waits do not count toward CPU. This is not evidence that the existing Nest,
  bcryptjs cost 10, Prisma and transactional lifecycle/heart/receipt/collection
  paths fit or improve latency. Actual account usage/quotas were not inspected.

**Decision:** retain the working stack provisionally. No measurements yet justify
a provider rewrite, paid plan or keep-alive traffic. If independent measurements
still make startup a material pilot blocker, isolate a time-bounded Workers +
existing disposable database experiment: real token validation, password hashing,
generated client/runtime compatibility, transactional/racing writes, connection
limits, quota/CPU failure and compatible recovery. Compare latency, quotas and
maintenance before proposing migration. T08 measured acceptance remains open.

## Owner acceptance still pending

Run selected build/tests/typecheck/OpenSpec validation, then exercise:

- Resume bursts, simultaneous Dashboard/Journey/Chain refresh and explicit Retry:
  share pending reads, refresh inbox/collection, recover after hidden midnight.
- Expired session versus temporary 503/offline; repeated session Retry, account
  switch/logout while requests are pending, exact invite return and preserved drafts.
- Successful auth with slow/failed habit sync: navigate promptly, show skeleton or
  stale cache with retry, never enable stale completion or erase cached progress.
- Slow/stalled auth/Chain/inbox/save, notice dismissal with multiple pending calls,
  unknown write outcome, saved dismissal and Mero read/save/habit-change races.
- Installed PWA resume/update, mobile networks, keyboard/short-window/themes.

Record revisions and measured results here or in T09 acceptance; do not check off
runtime outcomes from prepared source or the older October 18 release evidence.
