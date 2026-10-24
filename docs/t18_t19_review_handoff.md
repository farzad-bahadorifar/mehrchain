# T18 / T19 implementation and acceptance handoff

Date: 2026-10-23 (Asia/Tehran). Base: upstream `main`, `c1301b5`.
Branch: `codex/t18-t19-updates-mobile`.

Code implementation is ready for review. This document does **not** record a
production deployment, a signed public release, or physical-device acceptance.

## T18: updates and Android publication

- `app-version.json` owns the UI/Android version and code. The package and lockfile
  mirror it and fail validation when inconsistent. Initial version is
  `1.0.0-rc.4`, Android code `4`; this is still a preview, not a v1 launch claim.
  The build generates ignored service-worker configuration with the same version.
- Android reads the **installed** package version/code, app ID, debuggable flag and
  signing certificate through the read-only `AppRelease` Capacitor plugin. Debug
  installations cannot receive incompatible official upgrade offers.
- `GET https://mehrchain.pages.dev/updates/android` is a public Pages Function,
  independent of the authenticated backend proxy. It forwards no account headers.
  It reads at most ten GitHub releases and three eligible manifests within a total
  eight-second deadline, bounds response sizes, and caches success for 15 minutes
  and upstream failures for one minute. Client background checks run after Angular
  stability, at most hourly, and on visible resume/reconnect with the same cooldown.
  Native identity, metadata and web checks have separate deadlines; manual retry is
  available in Profile without blocking habits.
- Discovery excludes draft/prerelease flags **and** RC/preview tag suffixes. A
  stable release requires `mehrchain-release.apk`, `release-manifest.json`, the
  pinned certificate, application ID, a matching GitHub asset SHA-256 digest/size,
  and exact canonical download URLs. The installed certificate and increasing
  semantic version/Android code are checked again on-device.
- Update/Later is separate from local What's New notes. Later lasts 24 hours per
  release, survives restart, and does not hide another newer release. Profile
  retains access to a deferred offer. Native Update confirms then hands the URL to
  Android's external browser/installer through Capacitor URL interception; no
  silent installation or app-data deletion occurs. External-browser download
  progress/failure is handled there; the in-app retry remains available.
- Web updates use `VERSION_READY`, an explicit reload confirmation, and a full
  reload (without `activateUpdate()` chunk mixing). Opening Profile only clears
  the local release-notes dot. APK builds do not register Angular service workers.
- The APK workflow runs generation, tests, frontend production build and Android
  debug/release assembly on PRs. Only a separate canonical-repository publication
  job receives signing secrets/write permission. That job requires all signing
  inputs and matching tag, checks published versionCode history, aligns/signs the
  release, verifies signature/certificate/application ID/version/debuggable flag,
  and creates a manifest/checksum. It publishes **only** these three verified
  assets; no unsigned/debug fallback. RC suffixes set GitHub `prerelease: true`.
  Official publications are serialized across branches to protect versionCode.

### Owner configuration and release procedure

1. Retain and securely back up the intended release keystore. Do not generate a
   replacement key for an existing signed installation. Configure GitHub secrets
   `ANDROID_KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD` in the
   canonical repository's `android-release` environment or repository settings.
2. Set the **public** variable `ANDROID_SIGNING_CERT_SHA256` in GitHub and the Pages
   Function environment to the same certificate SHA-256 (hex, colon separators
   accepted). The Pages endpoint fails closed with 503 until it is configured.
   No private key or password belongs in Pages, frontend code or this repository.
3. Deploy the reviewed Pages frontend **and Functions**; verify `/updates/android`
   returns JSON with CORS, rather than SPA HTML or a Render proxy response.
4. For each distributed update, bump `app-version.json`, package and lock root
   versions; use a code higher than every distributed build. Historical rc1–rc3
   used code 1; all new official releases carry verifiable manifests. Run
   `node scripts/android-release.cjs validate v<version>` before tagging.
5. After review/acceptance, use a matching `v<version>` tag or manual publication
   with an explicit matching `version_tag`. This PR creates no tag or release.
6. Verify a same-key upgrade from a signed test build to a higher-code build,
   retaining the account, habit/history and preferences. Old downloadable RCs were
   debug/unsigned outputs, not evidence of a same-key release path; Android may
   reject upgrading a debug installation to an official certificate. Do not
   uninstall it to conceal a failed data-preservation test.

The authenticated account has pull-only access to the canonical repository
(`admin/maintain/push = false`). Signing settings and production Pages configuration
were not inspected or changed. Android SDK/Java are unavailable locally; APK
compilation/signing verification belongs to CI and the controlled release run.

## T19: mobile interaction and responsive fit (owner correction, October 24)

- Only primary coarse-pointer/no-hover environments receive viewport scale
  restrictions; desktop viewport settings stay intact. Device width, safe areas
  and keyboard `interactive-widget=resizes-content` remain in the single meta tag.
- Mobile scroll surfaces use `touch-action: pan-x pan-y` (no pinch permission).
  Safari gesture cancellation is limited to `gesturestart`/`gesturechange` inside
  the app on those environments. No blanket touch cancellation, forced scale
  reset, keyboard interception or global `touch-action: none` is introduced.
- All mobile input/select/textarea controls use at least 16 CSS px, including
  account, OTP, password, username, Why, duration and habit dialogs.
- The owner rejected the Text size feature on October 24. Its toolbar, dialog
  injection, font setter and saved preference are removed. Existing saved values
  are retired without overriding browser/device font settings.
- Onboarding shares the centered mobile-width shell on desktop/PWA. The full-width
  exception and desktop-only minimum card height are removed. The hero and spacing
  adapt to viewport height; long content and keyboard-constrained forms remain
  scrollable. No content is hidden just to remove a scrollbar.
- Multi-touch, cancelled gestures, control interactions and mostly vertical moves
  cannot trigger onboarding swipe navigation; coordinate zero remains valid.
- The current Mero canvas already has `pointer-events: none`; the shared policy
  does not add canvas gestures or modify its renderer.

### Evidence and limits

- Automated tests cover version comparison, wrong/older/prerelease metadata,
  signing-identity mismatch/debug exclusion, update consent, manual retry,
  deduplication, deferred notices/restart, listener teardown, gesture isolation,
  mobile viewport switching and retirement of the unrequested text-size preference.
- Historical October 23 preview (superseded text-size scope): welcome at 390 CSS px and 200% text exposed an
  intrinsic mascot overflow; the corrected fresh build was checked at 320 CSS px,
  200% text (`innerWidth=320`, document width `305` with a scrollbar), and at 390 px.
  This is a responsive desktop check, not phone/keyboard or mobile-gesture evidence.
  Initial cached PWA content also visibly offered a ready web update; the embedded
  browser's native-confirm automation stalled, so confirmation/reload is covered by
  service tests and remains a real-browser acceptance check.
- The APK workflow depended on five stale frontend fixtures already present in
  the base: guest collection invalidation timing, Journey session initialization,
  removed connection/invite copy and the motion-safe skeleton selector. Only those
  fixtures were corrected; unrelated product behavior was not changed.

### Physical-device matrix — all pending

| Target                       | Required evidence                                                                   |
| ---------------------------- | ----------------------------------------------------------------------------------- |
| Android Chrome tab           | Pinch, double-tap, each form's focus/blur and keyboard; first visit and refresh     |
| Android installed PWA        | Same triggers, existing install after SW update, fresh install and offline/resume   |
| iPhone Safari tab            | Same triggers, Safari gesture policy and browser/accessibility overrides            |
| iPhone standalone PWA        | Same triggers, safe areas, keyboard and browser-policy exceptions                   |
| Android signed Capacitor APK | Native identity, external download/installer, same-key higher-code upgrade          |
| Desktop touch/trackpad       | Compact mobile-width shell, browser shortcuts, resize/maximize and modal navigation |

For each row, record exact revision, device/OS/browser versions, display mode,
portrait/landscape, both themes, 320/390 CSS-pixel layouts, scale before/after each
gesture, scrolling/nested scrolling, text selection/copy/paste, autofill/OTP/password
manager, sliders, onboarding swipes/back, all routes/overlays, draft retention,
safe areas, background/resume and browser toolbar changes. Check no Text size UI,
no horizontal overflow/avoidable welcome scrolling, the compact desktop shell,
and main actions reachable with the keyboard open. Link results into T09.

Browser policy and user accessibility settings may override scale restrictions;
any such outcome is an unresolved acceptance/release decision until reproduced on
the target configuration. The historic WebKit article is not current iOS PWA test
evidence. No absolute zoom-lock or accessibility-conformance claim is made.

## October 24 correction validation

- Frontend: all 263 tests in 45 files passed after removing the text-size feature.
- Production build passed, with only the pre-existing compiler/unused-import/CommonJS warnings.
- Chromium welcome-page checks: 320x480, 320x568, 360x640, 390x844 and
  430x932 fit both actions with document height equal to viewport height and no
  horizontal overflow. Landscape 844x390 also fits after reducing decorative
  hero/title spacing. Desktop 1440x900 keeps a centered 544px shell.
- The 320x568 sign-in dialog has no text-size controls or horizontal overflow;
  content scrolls inside the dialog when necessary. Introductory pages with more
  text remain scrollable on short screens; no overflow-hidden clipping was added.
- Existing mobile zoom-policy/listener-cleanup tests pass; physical-phone
  pinch/double-tap/keyboard and installed-PWA acceptance remain unrecorded.
- This correction changes frontend/layout documentation only; T18 release
  discovery, Android signing and backend/database behavior are unchanged.

## Historical automated validation for PR #73

- Frontend: 45 files, 263 tests passed (`nx test mehrchain-frontend --watch=false --skip-nx-cache`).
- Backend: 20 suites, 173 tests passed after successful Prisma generation.
- Release discovery/publication: 8 Node tests passed.
- Frontend production build passed; generated `ngsw.json.appData.version` matches
  `1.0.0-rc.4`. Existing compiler/unused-import/CommonJS warnings remain.
- Workflow YAML parsed successfully and OpenSpec `--strict` validation passed.
- No local Android assembly/signing result is claimed.

## References

- [Angular service-worker update and reload guidance](https://angular.dev/ecosystem/service-workers/communications)
- [MDN touch-action semantics](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action)
- [WebKit zoom-policy background](https://webkit.org/blog/7367/new-interaction-behaviors-in-ios-10/)
- [W3C viewport/text-resizing rule and alternate resizing mechanism](https://www.w3.org/WAI/standards-guidelines/act/rules/b4f0c3/)
- [Android apksigner](https://developer.android.com/tools/apksigner)
- [Android apkanalyzer](https://developer.android.com/tools/apkanalyzer)
- [GitHub releases and asset digests](https://docs.github.com/en/rest/releases/releases)
