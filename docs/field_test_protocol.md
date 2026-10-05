# Private field test: 5–10 friends and family

Owner: project owner. Target: October 7–8, 2026, conditional on R7 passing. Status: prepared, not conducted.

## Before inviting anyone

- Finish the database procedure and provider setup in the roadmap.
- Record backend/frontend revisions and release baseline name. Run the two-account smoke, including disposable account deletion, on the public API.
- Repeat the journey in two clean browser profiles on the public Pages site. Check email delivery or real Google login, not preview codes.
- Create a private results file outside Git using the template below. Do not collect passwords, tokens, OTPs, or personal reflections. Use participant aliases.

## Wave 1: 2–3 people, approximately 20 minutes each

Ask testers to complete the following without coaching until they get stuck:

1. Open the public URL in a fresh browser and register using the configured real route. If email is enabled, use the code received in the actual inbox.
2. Create one private habit. Record its title and whether it appears after refresh.
3. Spark once. Refresh; count must increase exactly once. Tap twice rapidly and confirm no duplicate count.
4. Sign out and sign back in with the same account. The same habits/history must appear. Also open another browser/device to prove this is server data.
5. Make a second habit public. Copy its invite; share it with the paired participant. Compare Share, Copy and QR URLs for the same selected habit.
6. Receiver opens the invite while signed out, signs in, selects/creates a public habit and accepts. Both participants refresh and see their reciprocal chain. A self-invite or duplicate pair must fail visibly. The same unexpired invite must allow a third participant to connect their own public habit.
7. Complete the shared habit and confirm both partners see today's completion. Each partner sends Heart; refresh both sides and confirm the sender's saved state and the habit owner's received support. Yesterday's heart must not count today (UTC). Disconnect one pair and confirm the third participant remains connected.
8. Switch between accounts on the same browser. Habits, chains and Mero settings must belong only to the active account.
9. Use a disposable account for deletion. Confirm the other account's own habits remain while the deleted participant's chain disappears; the deleted account's old token/session cannot restore data.
10. Disable network before a save or Heart. The app must show an error, keep editable input, and avoid a success celebration. Restore connectivity and retry. Repeat once against an unreachable backend using browser request blocking.

Record each step as Pass, Fail or Not attempted. Capture exact visible errors and redacted request status if available. A cache-only reload is not persistence evidence; require a fresh API read or a clean second browser.

## Wave 2: remaining people, only after Wave 1 blockers are fixed

Re-run R7 after each deployed blocker fix. Include at least one mobile browser and the browsers participants actually use. Include a solo participant who does not accept any chain: registration, habit and Spark must work independently. If the test crosses UTC midnight, record that time; daily completion currently uses UTC calendar days.

## Results template

For the initial Iran test, use the PWA and Google sign-in. Without a verified domain, Resend cannot deliver to arbitrary testers. APK Google sign-in remains unverified. Record VPN on/off and whether the failure concerns Pages, Render, or Google, without collecting IP addresses or credentials. Keep the network stable during sign-in. A free Render cold start can take 50 seconds or more; do not repeatedly tap Spark while waiting. Check access on participants' actual networks; access is not guaranteed for every ISP.

| Participant alias | Wave | Device/browser | Auth route | Step | Result | Exact error / reproduction | Fresh read/reload evidence | Severity | Fix revision / retest |
| ----------------- | ---- | -------------- | ---------- | ---- | ------ | -------------------------- | -------------------------- | -------- | --------------------- |
|                   |      |                |            |      |        |                            |                            |          |                       |

Summary: invited **; attempted **; real account created **; solo journey passed **; paired chain passed **; dropout step/reason **; open P0 **; open P1 **.

## Decision rule

- P0: authentication bypass, exposed OTP/secrets, cross-account data, data loss, false saved success, or inability to complete the core journey. Stop expansion, fix, redeploy, rerun R7 and the failed step.
- P1: major usability failure with a reliable workaround. Record the workaround and owner; decide explicitly whether the limited test can continue.
- Cosmetic feedback: collect for later; do not expand feature scope during this week.
- No external test before R7 passes. No public launch with unresolved P0s. The owner records go/no-go and the next date; prepared documents and unit tests do not count as human test results.
