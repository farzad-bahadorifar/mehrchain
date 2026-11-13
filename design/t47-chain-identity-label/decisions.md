# T47 v0.1 decision

Date: 2026-11-05, Asia/Tehran. Artifact: index.html.
Decision: **Pending owner review**.

Proposed scope: remove only app-added @ prefixes; use username, then display name,
then Partner consistently across partner/invitation/private receipt and action
copy; use a grapheme initial; exclude email disclosure. No implementation.

Artifact SHA-256: 277e7fc8786a06cb0f3e644cad4b22492d0dbccfaa87b88029c3840b57910b02. User's request
to investigate the task is not approval of this unseen version. T49 may show
these provisional labels for context without claiming the T47 decision is final.

## v0.2 — owner correction applied 2026-11-05

Decision: **Accepted with the owner's explicit correction applied**. The owner
replied that @ must not appear in the displayed name either. Remove every @ from
the display candidates, fall back username -> display name -> Partner, derive
avatar/action labels from the same display value, and do not mutate stored data.
This changes exactly the requested presentation rule, without a new layout choice.
Email remains excluded. The owner separately clarified that invalid username
characters must not be saved; the existing client/server allowlist already rejects
@ and unsupported punctuation (letters/digits/underscore, 3-20 characters).

Artifact: index.html, SHA-256
`d06710edc12feb71acaee0c275513f8a5da0bd0eaafa52ad08eda154fccc4c02`.
Validation: 60 frame/theme/fixture states, identical no-@ labels and actions in
all contexts, no app overflow/page errors. No product implementation occurred.
The v0.1 pending decision above is retained as superseded review history.
