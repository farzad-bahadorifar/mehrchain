# T50: Invite Arrival Continuation Across Account & Installation States Analysis

Date: 2026-11-13, Asia/Tehran.
Scope: Systematic analysis and replay of invite link routing across 3 account states and 4 installation states.

## 1. Source Audit & Architecture Inspection

1. **`OnboardingGuard` (`apps/mehrchain-frontend/src/app/core/guards/onboarding-guard.ts`)**:
   - Evaluates whether the user is authenticated and has an active commitment.
   - If not authenticated, redirects to `/?returnUrl=${state.url}`.
2. **`AuthService.pendingInviteReturnUrl()` (`apps/mehrchain-frontend/src/app/core/services/auth.service.ts`)**:
   - Inspects `queryParams['returnUrl']`.
   - **Open-Redirect & Malicious Path Defense**: Strictly enforces that target starts with `/chain?`, has a single primary route segment `chain`, and possesses a valid, non-empty `invite` query parameter.
   - Any external URL (e.g. `//malicious.com`, `javascript:...`) or unrelated internal route (e.g. `/profile`) is discarded and returns `null`.
   - `navigateAfterLogin()` navigates to the validated invite URL; if null, falls back safely to `/dashboard`.
3. **`OnboardingComponent` (`apps/mehrchain-frontend/src/app/features/onboarding/onboarding.ts`)**:
   - Preserves `returnUrl` during the step-by-step onboarding wizard.
   - Upon creating the user's first habit and completing registration, invokes `authService.navigateAfterLogin()`. This delivers the new user directly to `/chain?invite=XYZ`, with their newly created habit ready for selection on the T49 acceptance card.
4. **Android APK Manifest (`android/app/src/main/AndroidManifest.xml`)**:
   - Currently contains only `android.intent.action.MAIN` and `android.intent.category.LAUNCHER`.
   - Lacks `<intent-filter>` for HTTP/HTTPS web links or custom schemes (e.g. `mehrchain://`).
   - Consequently, tapping a web invite link outside the app opens the system browser (Chrome), not the installed APK.

## 2. 3x4 Matrix: Account States vs Installation States

| Installation State \ Account State | 1. Signed-In Account | 2. Returning Signed-Out Account | 3. New Account (First Launch) |
| :--- | :--- | :--- | :--- |
| **A. Browser Tab** | Direct `/chain?invite=...` navigation; T49 acceptance card renders. | `OnboardingGuard` redirects to `/?returnUrl=...`; login succeeds -> `navigateAfterLogin()` routes to `/chain?invite=...`. | Redirects to Onboarding with `returnUrl`. User sets up first habit -> routed to `/chain?invite=...`. |
| **B. Installed PWA** | Opens directly in PWA window if launched from app or browser shortcut; full session active. | PWA opens login; `returnUrl` preserved in URL tree; routes to target upon OTP entry. | Onboarding wizard runs inside PWA shell; target restored upon finish. |
| **C. Installed APK** | External link opens in Mobile Browser (due to missing intent-filter in manifest); user authenticates in browser or must copy code. | Opens in Mobile Browser; standard web returnUrl flow applies. | Opens in Mobile Browser; full onboarding in browser. |
| **D. No Installed App** | Opens in standard mobile/desktop web browser; direct to T49 card. | Opens in web browser; login with returnUrl restoration. | Opens in web browser; onboarding with returnUrl restoration. |

## 3. Deliberate Acceptance & Cancellation Invariants

- **Deliberate Acceptance**: Navigating to the invite URL never automatically creates a connection. It only opens the T49 invite acceptance card, requiring explicit selection of an eligible habit and a deliberate tap on "Accept Invitation".
- **Cancellation & Back Navigation**: If the recipient cancels or taps back, they are routed to `/dashboard`. The pending invite parameter is cleared, preventing unintended lingering acceptance dialogs.
- **Expired/Invalid Code**: Handled gracefully by `ChainService` displaying an informative error card ("This invitation has expired or is invalid") with a button to return to dashboard.
