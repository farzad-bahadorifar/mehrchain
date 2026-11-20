# MehrChain production deployment

Cloudflare Pages serves the web app and forwards `/api/*` to the NestJS backend
on Deplexo. The web app, PWA, and signed Android app use the same public API.

| Component | Production setup |
| --- | --- |
| Web and API ingress | [`mehrchain.pages.dev`](https://mehrchain.pages.dev), Cloudflare Pages with GitHub `main` |
| Backend | Deplexo service `mehrchain-stage`, deployed from the root [`Dockerfile`](../Dockerfile) on `main` |
| Database | Existing production Neon PostgreSQL database |
| Android | [Signed releases](https://github.com/farzad-bahadorifar/mehrchain/releases), update feed at [`/updates/android`](https://mehrchain.pages.dev/updates/android) |

## Configure and deploy the backend

- Use the root Dockerfile. The image installs the locked dependencies, generates
  Prisma Client, builds the backend, and starts `node main.js` on port `3000`
  unless the platform supplies `PORT`.
- Set `DATABASE_URL`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, and
  `BACKEND_PROXY_SECRET` in Deplexo's runtime settings. Keep the existing
  production database and JWT key when redeploying the same application.
- In Cloudflare Pages production, `BACKEND_ORIGIN` points to
  `https://mehrchain-stage.de.deplexo.com` and the encrypted
  `BACKEND_PROXY_SECRET` matches the backend. Keep the Pages Google client ID
  and Android signing certificate bindings in place. Include the Pages Functions
  bundle in API-serving deployments so these bindings are applied.
- Mail delivery requires a verified sender and configured `RESEND_API_KEY` and
  `MAIL_FROM`. See [D-002](roadmap/context.md#d-002) for its separate acceptance.
- Apply only pending reviewed migrations before deployment when a release
  requires them. Follow the [migration procedure](database_migration_procedure.md).
- Deploy the reviewed revision from Deplexo and check its commit and build logs.
  If Pages settings change, deploy the Pages project with the saved bindings.

[Deplexo Docker builds](https://docs.deplexo.com/guides/docker/) ·
[Deplexo runtime variables](https://docs.deplexo.com/guides/environment/) ·
[Deplexo deployments](https://docs.deplexo.com/operations/deployments/)

## Verify production

1. Compare fresh JSON responses from the direct Deplexo and
   [public Pages version endpoint](https://mehrchain.pages.dev/api/version).
   Check the build timestamp and auth contract against each other and use the
   Deplexo deployment record for the Git commit.
2. Verify that invalid credentials return `401`, invalid signup data returns
   `400`, and an existing authorized account can sign in through Pages.
3. Check the Android update feed and sign in with the existing app if needed.
   Backend changes behind the same public URL apply to installed APKs.

The November 2026 migration, production checks, and previous-provider rollback
details are in the [T72 cutover record](roadmap/evidence/2026-11-19-t72-hosting-rehearsal.md#production-cutover-result).
