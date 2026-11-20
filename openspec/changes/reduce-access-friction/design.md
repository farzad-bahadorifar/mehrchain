## Decisions

> This historical record describes the former hosting setup. Production now runs on Deplexo.
> See the [current deployment guide](../../../docs/production_deployment.md).

- One foreground event source coalesces focus/pageshow/visibility/online bursts
  for 200 ms. Existing per-session habit, Chain and inbox pending reads remain;
  Mero gains its own shared read promise. Requests for distinct resources remain
  independent. No response cache or time-based suppression of explicit retries.
- An expired automatic habit/Chain timer marks state stale while hidden/offline;
  resume fetches fresh account calendars before completion/support is enabled.
  In-flight work is allowed to settle; user writes retain their existing guards.
- Mero records one deferred refresh when habits change during a read/save. Its
  existing generation and user/token checks reject older reads after a save or
  session switch. No new automatic write retry or eligibility import.
- A scoped API interceptor wraps subscription/finalization for wait tracking and
  applies a 90-second inactivity deadline, including the post-Sent wait. Existing
  shorter mutation deadlines are retained; startup/session/calendar/collection
  reads allow 90 seconds. A timeout cannot prove the server rolled back a write.
- Confirmed auth starts habit sync without awaiting it. The store is stale/loading
  before navigation; existing skeleton/retry/disabled-completion states apply.
  Explicit session retry shares pending verification and preserves invite/drafts.
- Public probes use only fixed version/Google script URLs. Database mode requires
  an explicit environment URL, runs SELECT 1, closes the connection and records
  no account rows. Each invocation has one target so one cold request cannot be
  mislabeled as a second independent cold-route sample.

## Risks and limits

Browser event timing, installed-PWA lifecycle, fake-timer scenarios and confirmed
save/session races require owner execution. A 90-second deadline accommodates the
documented Render wake-up window, not a guaranteed startup SLA. Client-to-database
SELECT 1 and Google script reachability are diagnostic components, not backend
transaction/authentication benchmarks. Preserve the current stack pending real
measurements; Workers requires representative bcrypt/auth/Prisma/transaction and
recovery evidence within free CPU limits before a migration decision.
