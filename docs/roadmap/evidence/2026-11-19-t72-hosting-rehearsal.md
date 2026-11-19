# T72 alternative backend rehearsal

Northflank Sandbox is the first candidate for the existing NestJS service. Its
published plan includes an always-on web service and GitHub integration without
a card. Northflank describes Sandbox as suitable for experimentation. Production
reachability and the owner's account eligibility require direct verification.
[Sandbox plan](https://northflank.com/pricing)
[GitHub integration](https://northflank.com/docs/v1/application/getting-started/link-your-git-account)

## Rehearse in isolation

1. Use a Northflank Cloud Developer Sandbox project and a combined service for
   the `T72` branch. Select Dockerfile with build context at the repository root
   and file `/apps/mehrchain-backend/Dockerfile`. Expose HTTP port `3000` and
   set the readiness path to `/api/version`.
2. Create a Neon schema-only branch and check migration status. Install the
   reviewed migrations on that branch if it is empty. Use a stage-only
   `DATABASE_URL`, stage-only `JWT_SECRET` and a separate stage proxy secret.
   Put these values in runtime secrets. Seed only synthetic test users.
   The image startup checks schema readiness without applying migrations.
3. Verify health and commit identity both directly and via a dedicated test Pages
   setup, with the new host in `BACKEND_ORIGIN`. Set the same random 32-byte
   lowercase hex value as `BACKEND_PROXY_SECRET` in the test Pages environment
   and test backend. The proxy derives visitor identity from Pages ingress and
   replaces any identically named incoming headers.
4. Verify healthy and invalid password login, protected reads and username
   writes through the test proxy. Check two independent visitor budgets,
   lifecycle reconciliation and the Google flow with an authorized test client
   if its origins allow it. Use only synthetic credentials in the test setup.
   Repeat from a real phone before the production switch.

## Production switch and rollback

Keep the public Pages URL and existing APK API address. Confirm the deployed
backend revision and the production Neon schema against the accepted candidate,
then use the existing production JWT configuration to preserve sessions. Scope
the production proxy secret to the production environment. Validate the host and
runtime secrets before assigning `BACKEND_ORIGIN` in Pages production.

The application reconciles lifecycle on access and has a best-effort hourly sweep.
Keep only a single production worker running once the origin is switched. Retain
the Render service configuration for rollback. To revert the routing, unset
`BACKEND_ORIGIN` and the Pages `BACKEND_PROXY_SECRET`, then redeploy the last
known-good Pages revision. Resume the Render service first if paused.

Production account credentials, Neon records, JWT secrets and the app signing key
stay outside the repository and the staging container. The separate email
delivery prerequisite remains D-002.
