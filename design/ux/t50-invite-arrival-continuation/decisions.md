# T50 Decision Record

Date: 2026-11-13, Asia/Tehran.
Artifact: `design/ux/t50-invite-arrival-continuation/index.html` (v0.1).

## Scope & Decision

Decision: **Approved based on code inspection and owner routing requirements**.
1. **Preserved Flow**: Invite URLs (`/chain?invite=...`) are preserved through `returnUrl` during both login and new-user onboarding, delivering the recipient to the T49 acceptance card.
2. **Security Invariant**: `pendingInviteReturnUrl()` strictly allows only internal `/chain` routes with valid `invite` params, preventing open-redirect vulnerabilities.
3. **Deliberate Acceptance**: Acceptance requires conscious user confirmation; landing on the page never auto-pairs.
4. **Platform Honest Baseline**: Android APK links open in mobile browser pending future App Links configuration.
