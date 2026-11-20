# Main integration verification — 2026-11-18

> This historical record describes the former hosting setup. Production now runs on Deplexo.
> See the [current deployment guide](../../production_deployment.md).

Integrated feature tip `a11b26b` with main baseline `2947e41`. Both histories
are preserved. The four roadmap conflicts were resolved from the union registry,
then generated views were refreshed. T57 retains its main-branch Mero meaning;
the development-sign-in record from `4b6f809` (originally feature T57) is T64,
with unchanged historical acceptance evidence. No deployment took place.

## Chain behavior

- **T61:** Nest resolves the supplied log ID within the owned linked habit's
  transaction, rejects missing, foreign, pre-link and unavailable events, and
  confirms only a saved event. Jest tests cover midnight, duplicate links,
  unchanged original timestamps and competing events for the same recipient day.
  Connect/disconnect lifecycle locking and anonymous incoming aggregates remain
  in place; a replay does not re-credit Mero or restore cleared support.
- **Migration:** Ran the complete nine-step `prisma/release-migrations` chain in
  an isolated PostgreSQL WASM instance with synthetic users and a legacy
  allowance inserted before the new migration. Its event ID remained null.
  PostgreSQL rejected a duplicate event across days and a second event on the
  same day; a different event on the next day succeeded. The historic audit
  chain was not changed. Back up/rehearse, apply the reviewed release migration,
  then deploy the API and frontend in that order; no live database was touched.
- **T62/T63:** Compiled production frontend checked in Chrome at 320, 390 and
  544 CSS px in each theme, with mocked API responses and external requests
  blocked. All six runs showed the prior evening's event and no card for the
  incomplete partner, active relationships and details only in Connect,
  keyboard ArrowRight/Home navigation, a heart failure followed by explicit
  retry and a filled confirmed SVG, private disconnect with draft preserved on
  failure and removed after confirmation, and invitation entry into Connect.
  No document horizontal overflow or page errors occurred. Angular tests
  additionally exercise the disabled stale and pending heart controls.

## Startup and Android assets

- **T57:** Angular renderer tests simulate WebGL loss, restore and foreground
  recovery. Rendering resumes after one scene recreation; a valid 2D snapshot
  is preserved, and the unavailable DOM state hides orphaned glow.
- **T59:** Angular HTTP tests distinguish 401/403, 502/503/504, network status 0
  and the bounded deadline. Recovery retries the protected read manually,
  never authenticates from the remote cache and clears rejected credentials.
- **T60:** `scripts/android-splash.ps1 -Verify` reproduced all eleven PNGs,
  including the generic fallback and both orientations from mdpi through
  xxxhdpi. The approved raster Mero is cropped at source then downsampled
  with high-quality interpolation (104 to 416 px of artwork); no high-density
  bitmap relies on upscaling a lower-density sprite. Inspected the result at
  hdpi. No Android APK build or device acceptance is claimed.

## Final local checks

- Production frontend/backend build with Nx cache disabled passed. The existing
  QR CommonJS warning remained; Google sign-in was not configured or verified.
- Nx suites passed: 297 frontend tests in 47 files and 174 backend tests in
  20 suites. Nine roadmap/language script tests, Prisma schema validation,
  roadmap validation and the render-blocking startup stylesheet guard passed.

## Remaining acceptance

- **T29:** Read-only November 18 probes: Pages version failed before an HTTP
  response with a local TLS negotiation error; direct Render version and
  OpenAPI endpoints each hit a 20-second deadline without an HTTP response.
  No serving revision, root cause, or repair is claimed. Resume when both
  routes respond from an authorized network and, if required, use an authorized
  test account to observe the actual username save.
- **T30/T56:** This host did not have access to a physical Android test phone
  or Android SDK/ADB. Desktop emulation does not satisfy their acceptance.
  T30 needs a named Android Chrome phone and test account; T56 also needs a
  served T55 revision, controlling worker and ten captured cold launches.
