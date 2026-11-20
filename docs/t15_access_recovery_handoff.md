# T15 bounded gateway recovery — October 21, 2026

> This historical record describes the former hosting setup. Production now runs on Deplexo.
> See the [current deployment guide](production_deployment.md).

API GET/HEAD requests now retry one transient 502/503/504/524 response after one
second, using the remaining 90-second request budget. Writes retain a single
attempt and explicit refresh-before-retry guidance. Unsubscribing cancels a pending
retry and releases wait tracking. The wait banner retains only its short status
and dismiss control. Regression source covers bounded retries, write safety and
cancellation; no local tests/builds were run.

Both checked-in Pages proxies already forward path/query, authentication, response
status and DELETE bodies. No provider timeout setting was changed. Cloudflare's
[524 documentation](https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-5xx-errors/error-524/)
describes an origin read timeout and separate write timeout, rather than a general
Pages knob that this project can increase. Render's
[free-service documentation](https://render.com/docs/free) confirms spin-down
after 15 idle minutes and a wake-up loading page. The client does not promise an
exact wake-up duration or use recurring traffic to keep the free service awake.

## Live warm observations

On the unchanged live `c8d193d` deployment, the existing
`scripts/measure-access-latency.cjs` recorded these operator-labeled warm samples
at 21:28 Asia/Tehran over `operator-vpn`. Each returned HTTP 200, matching revision
and account-timezone-v1. Node 24 was invoked with `--use-env-proxy` and the existing
local proxy so these probes use the operator's network route.

| Route | Sample 1 total | Sample 2 total |
| --- | --- | --- |
| Direct Render | 645.5 ms | 121.1 ms |
| Pages proxy | 503.2 ms | 182.5 ms |

These observations precede deployment of this local retry change and do not prove
a performance improvement. Independent idle samples and real phone/PWA/network
acceptance remain open; a warm second route cannot be labeled independently cold.

## Later operator-labeled idle attempt

At 21:45:03 Asia/Tehran, after more than 16 minutes without an API probe from this
session, the proxy idle sample failed after 2175.4 ms with the script's sanitized
`connection-or-redirect` classification. It did not establish API readiness or
prove a specific provider cause. A separate follow-up labeled warm, at 21:48:04,
returned the same matching HTTP 200 revision after 62878 ms. That label does not
prove the origin was already warm, and this slow result is retained rather than
folded into the earlier fast observations. Other users' traffic and target-phone
networks were not controlled. Further independent idle/mobile acceptance remains
open; these are baseline observations of the live code, not of the local retry fix.
