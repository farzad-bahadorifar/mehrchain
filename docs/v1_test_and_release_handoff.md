# V1 testing and release handoff — historical English reference

Original last entry: **2026-10-06**, Asia/Tehran. "Tomorrow" in that source meant
October 7. This reference preserves the historical findings, not current deployment
readiness. Exact original text is retained as `docs/v1_test_and_release_handoff.md`
in the [source archive](archives/README.md). Read [the current roadmap](development_roadmap.md) first.

## Decision at that time

- Internal PWA testing could start; actual login and complete two-account acceptance
  had not been recorded. A test APK existed, but phone install/login was unaccepted.
- No new final tag was needed to obtain a test APK. Public `v1.0.0` was to follow
  internal acceptance, human pilot waves and resolution of release risks.
- Secret rotation, human-test results and successful Google login were not to be
  marked Done without new evidence.

## Recorded evidence and limits

| Area | October 6 observation | Boundary |
| --- | --- | --- |
| Render | Live revision `483f6c4dce26b87154fb8ea0dcc50cb05b512dd6` | No valid Google identity/full production user flow accepted |
| Pages | Revision `742177338d9d9035e78c626dfff191dfa420a21d`; difference from backend revision was documentation | An installed PWA could retain older assets |
| API | Direct/proxy root returned 200; invalid Google token returned 401 | Root/invalid-token probes do not accept all routes or login |
| Google | Matching public client ID and official identity UI observed | Actual user selection/login required normal Chrome; the in-app popup did not complete |
| Database | Actual Render target matched; snapshot and release migrations rehearsed/applied; repeat deployment was a no-op with zero drift | An older local .env was not production |
| Rehearsal | Temporary accounts exercised shared invites, duplicate completion protection, hearts, daily expiry, ownership and disconnect | Direct service/rehearsal evidence, not two-account HTTP/Google acceptance |
| Recovery | A branch from the pre-change snapshot was checked | Not a populated-user recovery or live service switch drill |
| Local checks | Backend 102 tests/12 files; frontend 151 tests/31 files; both production builds passed | Historical counts are not current suite acceptance |
| APK CI | Run `37374644940` on `7421773` succeeded | Build success is not Android auth acceptance; the artifact's dated expiry must not be assumed current |
| Dependency review | 19 production dependency findings: 1 low, 4 moderate, 14 high, no critical | Exploitability/public-route impact remained unassessed |

## Implementation recorded in that handoff

It described reusable habit invitation links, reciprocal independent connections,
duplicate completion protection, revised support/notifications, lifecycle handling
independent of an always-running cron, periodic foreground refresh and initial
Android API/origin configuration. Its then-current UTC/time/heart contract was
later superseded by the dated account-calendar and idempotent-support work. Do
not implement those older semantics again; current rules are in [policies](roadmap/policies.md).

## Remaining work at the historical checkpoint

1. The owner was to complete and verify an exposed-secret rotation privately;
   the assistant had not confirmed it. No new secret belonged in frontend/chat.
2. Actually sign in two independent PWA users and prove stable identity after logout/login.
3. Accept the complete internal habit/invite/completion/support/disconnect flow,
   then phone APK install/login and same-key upgrade.
4. Resolve release risks before inviting broader human test waves and publishing.
5. Read actual current service revisions/workflow results first. Confirm the exact
   database target and a fresh usable snapshot before any new migration.

The handoff also recorded that the verified Resend domain was missing, so general
email OTP was not a working fallback. That known constraint must not be rediscovered
as an unexplained UI bug; read D-002. Google sign-in and transactional email are
different acceptance paths. Current SMS constraints are in D-003, not inferred
from this older note.

## How to resume now

Use the current task registry, not this old checklist. Recheck only the relevant
actual state for a bounded requested task. Do not equate a successful old artifact,
service rehearsal, demo token, version badge or invalid-token probe with release
acceptance. The exact historical URLs, public identifiers, database branch labels,
artifact expiration and original continuation prompt remain in the archived record.
