# Production API ingress and Android signing follow-up

## Live reproduction

On November 19, 2026, at 02:35 UTC, one sign-in attempt with a synthetic
identifier on the public Pages site returned 429. The public
`/api/version` route, which has no authentication throttle, also displayed
`Too Many Requests` on a fresh request. The direct Render hostname displayed a
Cloudflare security challenge with Ray ID `a5cbd0ba2c8b974a`. The deployed Pages
hostname reproduced the upstream-branded challenge with Ray ID
`a5cbd1803db7815a`. The static landing page loaded on the public hostname.
Render Application Logs showed the RC6 Nest routes mapped. Request Logs were
unavailable in the dashboard, so the exact Render mitigation rule is unconfirmed.

Render documents that free services have lower inbound traffic limits and that
its protections can issue 429s. The exposed symptom is upstream of the
application's login throttle. Keep the application limits and request behavior
intact while Render investigates. [Render troubleshooting](https://render.com/docs/troubleshooting-deploys#429-too-many-requests)

## Application handling

Both Pages API proxy layouts map upstream Cloudflare challenges and non-JSON
429s to a no-store JSON 503. A genuine JSON API 429 retains its status, body
and retry header. The client also identifies a plain-text 429 returned before
the proxy and keeps the submitted form values for manual retry. The proxy
does not replay the request. These changes make the outage visible without
claiming production connectivity is restored.

Verification: 304 frontend tests, 180 backend tests, 17 release/proxy script checks and both
production builds passed. The proxy test sends a streamed POST through each
Pages layout and checks challenge, upstream throttling and application
throttling responses. [Cloudflare challenge identification](https://developers.cloudflare.com/cloudflare-challenges/challenge-types/challenge-pages/detect-response/)

## Render support handoff

After Pages deployed `735064fd`, fresh public and direct probes both returned
the expected JSON and the Render revision `f54faf65`. At 02:43 UTC the live
sign-in form received the expected 401 from the API for synthetic credentials.
At 02:44 UTC the onboarding signup form received the expected 400 for the
reserved test email domain. No account, email, or other production data was
created in these checks. The first observed recovery does not establish which
edge control stopped blocking the earlier requests. An authorized successful
sign-in and real delivery (D-002) still require separate checks.

Use this draft if the ingress failure returns.

> Service `mehrchain-api` in Frankfurt is running and the static Pages site
> loads. At approximately 2026-11-19 02:35 UTC, a single synthetic POST to
> https://mehrchain.pages.dev/api/auth/login returned 429. An uncached GET to
> https://mehrchain.pages.dev/api/version also returned Too Many Requests.
> The direct https://mehrchain-api.onrender.com/api/version path displayed a
> Cloudflare challenge, Ray `a5cbd0ba2c8b974a`. The same origin challenge was
> visible through Pages on the deployment hostname, Ray `a5cbd1803db7815a`.
> Could you identify which edge control is blocking these requests and
> advise on the supported configuration for normal Cloudflare Pages
> Function traffic to our Render API?

After recovery, check an uncached version response on both hosts, check that a
single wrong-password sign-in yields the expected 401, and exercise sign-in
with an authorized test identity. Verify the expected signup response without
sending email to a third party. D-002 separately owns real inbox delivery.

## Android upgrade identity

The `mehrchain.apk` and `mehrchain-debug.apk` assets on the official GitHub RC3
page are byte-identical, with SHA-256
`0fa47123c28a356bf4d0152b9ea6a773d892e58bdb24a6c9d744ea547862aeba`.
The RC3 workflow copied the debug APK to the standard download name when no
keystore was configured. Its APK Signature Scheme v2 signer has subject
`CN=Android Debug` and SHA-256 fingerprint
`59e7d6bede9b0b294ca2ff9563e51afee4afeffa3681018def11b2ab4ddb9ebc`.
The RC6 CI debug artifact has a different signer fingerprint
`e654765b36a890531f17f26f8e3cd4a4c6067a7eaee6fada3182399c1502a128`.
These fingerprints were extracted from the APKs; no in-place device install
was attempted. GitHub's repository and `android-release` environment have no
signing secrets or certificate pin.

The original matching private key is required to upgrade the public RC3
installation in place. An owner-approved new package and persistent key can
ship a separate installation while preserving the old installation on the
phone. The separate package has its own local data and session. Authentication
and sync require the production API to be reachable.
[RC3 assets](https://github.com/farzad-bahadorifar/mehrchain/releases/tag/v1.0.0-rc3)
[Android signing requirements](https://developer.android.com/studio/publish/app-signing)

Capacitor dependency ranges and `capacitor.config.ts` are unchanged since RC3.
The native changes are in the Android Gradle metadata, `MainActivity`,
`AppReleasePlugin` and the startup resources. Build with `npx nx build
mehrchain-frontend --skip-nx-cache`, `npx cap sync android` and
`./gradlew assembleRelease` from the Android directory. Use the
existing signing workflow to produce a distributable APK.
