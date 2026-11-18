# T41: Notification Events and Actual Platform Delivery Inventory

Date: 2026-11-13, Asia/Tehran.
Status: Evidenced Analysis Report.
Context references: [D-011](../context.md#d-011), [D-008](../context.md#d-008), [D-002](../context.md#d-002), [D-003](../context.md#d-003).

## 1. Executive Summary & Proven Facts

1. **No Remote Push Infrastructure Exists**:
   - Neither FCM (Firebase Cloud Messaging), Web Push, VAPID keys, nor APNS are configured or present in backend dependencies (`package.json`).
   - `ChainNotificationService` in backend is a database-only updater that updates `lastPartnerActivityAt` and status on `ChainConnection` rows in PostgreSQL. It does **not** dispatch network push notifications to phones or browsers.
2. **Web / PWA Fallback Without Scheduling**:
   - In `apps/mehrchain-frontend/src/app/core/services/notification.service.ts` line 93-95:
     ```typescript
     if (!Capacitor.isNativePlatform()) {
       return true;
     }
     ```
     When running in a standard web browser or an installed PWA, `scheduleDailyHabitReminder` returns `true` (indicating success to the UI) **without scheduling anything**. Web notifications are not registered.
3. **Android Native Local Notifications**:
   - Relies on `@capacitor/local-notifications`.
   - `AndroidManifest.xml` only declares `android.permission.INTERNET`. On Android 13+ (API level 33+), runtime `POST_NOTIFICATIONS` is required by the OS.
   - Small icon referenced is `ic_stat_icon_config_sample`, which is a sample placeholder.
4. **In-App Events Are Polled / Fetched on View**:
   - Partner completion notices, received hearts, invitations, and disconnect receipts are in-app data cards retrieved via REST API when the user opens the application (or switches to the Chain tab).

---

## 2. Event-by-Platform Delivery Matrix

| Event | Trigger & Calling Service | In-App (When App Open) | Browser Tab | Installed PWA | Android Native App | Cancellation / Lifecycle |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Configured Daily Reminder** | User sets hour:minute in onboarding/profile. Calls `NotificationService.scheduleDailyHabitReminder`. | N/A (scheduled for specific time). | Returns `true`; **no notification scheduled**. | Returns `true`; **no notification scheduled**. | Scheduled locally via Capacitor LocalNotifications plugin. | Canceled via `cancelReminder(id)` when user turns off reminder. |
| **Partner Habit Completion** | Partner marks habit done -> backend `ChainNotificationService.notifyChainPartners` updates DB. | Displays completion card in Chain tab on next load / refresh. | None (no push). | None (no push). | None (no remote push server). | N/A (card stays until acknowledged or day rolls over). |
| **Received Heart** | Partner sends heart -> `ChainService.sendHeart` writes heart to DB. | Increments received heart count (`+N`) on next load. | None. | None. | None. | Resets on recipient account midnight. |
| **Partner Invitation** | User generates link/QR code. | Shown when recipient visits `/chain?invite=code`. | Rendered on web page. | Rendered on PWA page. | Rendered in native webview. | Cleared after acceptance or dismissal. |
| **Disconnect Receipt** | Partner disconnects chain -> backend creates `ChainDisconnectReceipt`. | Displayed in Chain view on next load. | None. | None. | None. | Acknowledged/cleared on user view. |
| **Voluntary Why Offer (T42)** | User achieves threshold consecutive days on Endless. | In-app contextual card / banner. | In-app only. | In-app only. | In-app only. | Suppressed upon skip or save. |
| **Absence Motivation Reminder (T43)** | Day 1 or Day 2 of uncompleted Endless habit. | Contextual in-app banner upon opening. | None outside app. | None outside app. | Requires scheduling local notification on app backgrounding. | Cleared immediately when habit is completed today. |
| **Archive Warning Notice (T43)** | Day 3 morning archival of Endless habit. | In-app alert in Journey / Memories. | In-app only. | In-app only. | In-app only. | Acknowledged by viewing archived memory. |
| **Partner Nudge (T44)** | Partner sends restrained nudge during recipient absence. | Partner nudge card in Chain view. | None outside app. | None outside app. | None outside app without push server. | Blocked if already completed today or archived. |

---

## 3. Inspected Source Gaps

1. **`NotificationService`**:
   - Lacks web Service Worker notification dispatch (`registration.showNotification`).
   - Lacks periodic background sync on PWA.
2. **`AndroidManifest.xml`**:
   - Missing `android.permission.POST_NOTIFICATIONS` for modern Android devices.
   - Missing `android.permission.SCHEDULE_EXACT_ALARM` if exact time delivery is required on Android 12+.
3. **Backend `ChainNotificationService`**:
   - Name is misleading: it is an entity-state mutator, not an OS notification dispatcher.

---

## 4. Atomic Follow-Up Mapping for Dependent Tasks

1. **For T42 (Optional Why Offer)**:
   - Design must be purely **in-app contextual UI** (e.g. A gentle card in Home or Onboarding), since remote push does not exist.
2. **For T43 (Absence Reminder & Archive Notice)**:
   - Schedule must define:
     - (a) In-app banners when user opens app during absence days.
     - (b) Local notification fallback when running on Android native app.
     - Must **not** assume background web push on PWA.
3. **For T44 (Private Partner Nudge)**:
   - Nudge delivery is an **in-app receipt/card** in the recipient's Chain tab, constrained by the anti-spam budget.
