# T72 alternative backend rehearsal

Northflank Sandbox was the first candidate. The owner's CLI authorization screen
required a card. Northflank's billing documentation also requires a payment
method to create resources on any plan. No service was created.
[Northflank billing requirements](https://northflank.com/docs/v1/application/billing/pricing-on-northflank)

Back4app Containers is the next rehearsal candidate. Its published Free plan
supports deployments from GitHub and a Dockerfile without a card, with 256 MB
RAM and 0.25 CPU. The backend Dockerfile is at the repository root and the CI
smoke uses those CPU and memory limits. Account access and public reachability
need verification on Back4app itself.
[Back4app free plan](https://www.back4app.com/pricing/container-as-a-service)

## Staging database and runtime verification

The available non-production Neon endpoint was distinct from both production
and the retained recovery endpoint. A new empty database and stage-only
login role were created there. The stage role has no SELECT permission on the
existing rehearsal user table. The reviewed release chain initialized the
new database, which holds one synthetic account. Staging credentials are
stored in a Windows profile-protected local file outside version control.

Using the production NestJS build locally against that database, HTTP tests
verified readiness, rejection of a wrong password, successful password login,
protected profile retrieval, and username save and removal. A separate
read-only production check found all nine expected release migrations and no
unresolved migration records. GitHub Actions also passed the container login
and protected-profile smoke on a disposable Postgres instance.
[Container verification](https://github.com/farzad-bahadorifar/mehrchain/actions/runs/44566693017)

## Rehearse in isolation

1. Use a Back4app Containers Free service for the `T72` branch with the
   Dockerfile and build context at the repository root. Expose HTTP port
   `3000` and probe `/api/version`.
2. Use an isolated, data-free Neon database. For a schema-only branch,
   check the release migration history before any change. On a genuinely empty
   database apply the reviewed chain with `node scripts/release-migrate.cjs deploy`.
   Use a stage-only
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
