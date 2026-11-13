# T52 Evidence Report: Web Update Activation and Viewport Analysis

Date: 2026-11-13, Asia/Tehran.
Scope: Investigating web update notice mechanics, Reload vs Later behavior, and isolating the reported layout fit regression from Image 11.

---

## 1. Owner Intent & Problem Statement

In the owner intake (Image 11), a web update banner (*"A web update is ready. Reload when you have finished your work."*) was observed coexisting with session restoration and the Welcome screen.
The core questions investigated:
1. What triggers and schedules the update notice?
2. What does the "Later" action persist?
3. Does clicking "Reload" alter the app viewport geometry or trigger a CSS layout fit regression, or does it simply reload the application to activate the updated bundle?

---

## 2. Source Code Architecture & Inspection

### A. Update Detection & Scheduling (`apps/mehrchain-frontend/src/app/core/services/version.service.ts`)
- **Event Source**: Listens to Angular's `@angular/service-worker` `SwUpdate.versionUpdates` stream. When the service worker completes downloading and preparing a new build hash in the background, it emits an event with `type: 'VERSION_READY'`.
- **Update Model**: Captures `latestVersion.hash` and version metadata into an internal signal `availableUpdate`.
- **Periodic Check**: Checks periodically upon app initialization when stable, every 60 minutes while active, and whenever `document.visibilityState === 'visible'` or window fires `online`.

### B. "Later" Dismissal Behavior
- Invoking `dismissUpdate()` stores a JSON record in `localStorage`:
  ```json
  {
    "id": "<build-hash>",
    "until": 1731600000000 // Date.now() + 24 hours
  }
  ```
- **Result**: The computed signal `showUpdateNotice()` immediately returns `false`. The update banner is unmounted from the DOM without any page reload or layout reinitialization. The notice remains suppressed for that specific build hash for 24 hours.

### C. "Reload" Activation Behavior
- Invoking `activateUpdate()` prompts user confirmation (`Reload to update MehrChain? Finish or save any open form first.`).
- Upon confirmation, calls `window.location.reload()`.
- The browser reloads the page, the new Service Worker claims clients (`clients.claim()`), and the application boots with the new JavaScript bundles and assets.

---

## 3. Viewport & Layout Fit Analysis

### A. Viewport Measurements
- **Window & Viewport Dimensions**:
  - `window.innerWidth`, `window.innerHeight`, `document.documentElement.clientHeight`, and dynamic viewport units (`100dvh`, `100svh`) are governed strictly by the browser/OS webview frame.
  - Calling `window.location.reload()` has **zero effect** on viewport width or height. The viewport dimensions before reload and after reload are identical (e.g. 390px × 844px on a standard mobile viewport).

### B. Root Cause of the Reported "Fit Regression"
- In `apps/mehrchain-frontend/src/app/app.html`, the update notice is rendered as an in-flow `<section>` element directly below `<app-cold-start-banner />` inside `<div class="app-shell">`:
  ```html
  <div class="app-shell" [class.has-navigation]="showNavbar()" [class.onboarding-shell]="!showNavbar()">
    <app-cold-start-banner />
    @if (versionService.showUpdateNotice()) {
      <section class="m-4 p-4 rounded-2xl bg-card border border-border text-sm" aria-label="App update">
        ...
      </section>
    }
    <router-outlet />
  </div>
  ```
- **In-Flow Layout Reflow**:
  1. The banner is an in-flow block element with margin (`m-4`) and padding (`p-4`), occupying ~88px to ~104px of vertical height.
  2. In Image 11, the app was simultaneously on the Welcome screen (`onboarding-shell`) while restoring session.
  3. Because `.onboarding-shell` uses `display: flex; flex-direction: column; min-height: 100dvh;`, the insertion of an ~96px in-flow block above the router outlet pushes the welcome illustrations and buttons downward toward the fold.
  4. Once "Reload" is clicked (or "Later" is chosen), the banner disappears. The ~96px element is unmounted, and the Welcome/Home view content shifts back up to its default layout position.
- **Conclusion**: There is no viewport collapse or CSS media-query defect. The visual shift was standard layout reflow caused by an in-flow banner being injected into and subsequently removed from the top of the flex container.

---

## 4. Remaining Unknowns & Physical Device Realities

- Physical Android Chrome and installed PWA visual states depend on the exact Android OS version and system navigation bar settings (gesture navigation vs 3-button bar).
- While local code analysis and Vitest unit testing prove the layout reflow mechanism, final visual confirmation on physical hardware remains tied to T30/T56.

---

## 5. Proposed Atomic Follow-up

- **Proposed Task**: If the owner desires an update notice that does not push page content downward, an atomic card can transition the banner from an in-flow block element to a floating, fixed-position snackbar/toast at the bottom of the viewport (above navigation).
- No speculative UI or layout changes are applied without explicit owner authorization.
