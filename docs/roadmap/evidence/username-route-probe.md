# T29 — live username route probe

Date: 2026-10-29, Asia/Tehran. All requests below were read-only and unauthenticated.

| Endpoint | Result |
| --- | --- |
| Pages `/api/version` | Request timed out at the configured 20-second deadline; no HTTP response body or revision available |
| Direct Render `/api/version` | Same timeout; no serving revision available |
| Direct Render `/api/docs-json` | Same timeout; no deployed route schema available |

Local source provides `GET /api/auth/username-availability` and authenticated
`PATCH /api/auth/username` in `auth.controller.ts`; frontend `AuthService` requests
those paths. This proves source agreement, not current deployment compatibility.

The old `Cannot PATCH` screenshot is a reported symptom, not evidence of today's
root cause. Network timeout is the current investigation blocker, not a proven
username validation or database bug. No credential was requested or used, no
save/migration/deployment was attempted, and no live repair is claimed.

Unblock T29 when direct/proxy version/schema are reachable. Compare revisions and
method forwarding, then separately reproduce availability and an authorized
test-account save if required. Record actual status/response class and propose one
fix for the evidenced failure. T28 only improves the UI handling of an unavailable
save route and deliberately does not close T29.
