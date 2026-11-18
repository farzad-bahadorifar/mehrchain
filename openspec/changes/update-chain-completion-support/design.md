# Chain completion acknowledgement

Use the existing canonical commitment log ID and require that the log belongs
to the linked partner habit. New acknowledgements only cover logs at or after
the current connection's creation, excluding surplus history duplicates and
future timestamps. A pending completion has no time-based expiry while the
relationship and habits remain available. A confirmed card remains through the
recipient day on which it was sent. A replay retains the original timestamp and
does not restore cleared support or write Mero progress again.

The existing ordered habit and connection locks serialize the completion, send
and detach paths. A nullable event ID and unique event key extend the daily
ledger, so existing allowances and received support remain intact without
guessing which completion, if any, a legacy heart acknowledged.

Apply the additive database migration before deploying the API, then deploy the
frontend. Do not backfill inferred event IDs or drop a populated event column
if rolling back application code. The old backend can coexist with the additive
schema; clients that haven't updated cannot write completionless hearts once
the new API takes over.
