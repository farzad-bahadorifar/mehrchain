# T14 production email setup — October 21, 2026

> The October 21 inspection describes the former host. Configure current production mail settings on Deplexo.
> See the [current deployment guide](production_deployment.md).

The authenticated Render environment was inspected during T12. It contains
DATABASE_URL, GOOGLE_CLIENT_ID, JWT_SECRET, NODE_ENV and NODE_VERSION, with no
linked environment groups. RESEND_API_KEY and MAIL_FROM are absent. Initially,
Resend domains redirected to login and required an interactive sign-in.
No usable Resend credential or verified sending domain was provided.
No credentials were created, account settings changed or verification mail sent.

The owner subsequently signed in to Resend. Its Domains page contains no domains,
and the owner confirmed they have no active purchased domain. T14 now waits for
an owned sending domain and sending credential, rather than login. No domain,
API key or charge was created. Resend's shared test sender cannot deliver to the
intended public recipients. To finish:

1. Acquire a domain (or use an owned domain/subdomain with DNS access), add it in
   Resend and publish the provider's SPF/DKIM records. Wait for verification.
   Resend does not supply a free production sending domain; see its
   [domain requirements](https://resend.com/docs/dashboard/domains/introduction).
2. Store the sending key privately in Deplexo as `RESEND_API_KEY` and set `MAIL_FROM`
   to an address on that verified domain. Do not commit either value or put it
   in frontend configuration.
3. Deploy the configuration and verify registration/verification and password
   recovery/setup delivery for the intended recipients. Record provider delivery
   and actual inbox/code completion separately.

The default onboarding@resend.dev address only sends test mail to the account
owner; it cannot establish production delivery to other users. See
[Resend's sender restriction](https://resend.com/docs/knowledge-base/403-error-resend-dev-domain).
The existing production mail failure remains a 503, with no console OTP fallback.
T17's verified password setup/recovery requires this operational gate before
release acceptance. No local tests/builds or workflow dispatch were run for T14.
