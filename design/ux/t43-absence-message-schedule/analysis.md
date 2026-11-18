# T43: Absence Reminder and Archive Schedule Analysis

Date: 2026-11-13, Asia/Tehran.
Scope: Absence reminder timing, author-only Why motivation, suppression on completion, third-day archival notice, and platform delivery.

## 1. Context & Contract Alignment

Per T36 (Endless Attempt Lifecycle) and T41 (Notification Platform Inventory):
- **The Canonical Absence Timeline**:
  - **Day 0 (e.g. Monday 23:00)**: Last completion logged. Active streak intact.
  - **Day 1 Missed (Tuesday 20:00 local)**: First missed date. A gentle in-app/local notification triggers reminding the author of their personal commitment.
  - **Day 2 Missed (Wednesday 20:00 local)**: Second missed date. A quiet check-in warns that 2 full missed dates will archive the Endless attempt at midnight.
  - **Day 3 Midnight (Thursday 00:00 local)**: 2 full calendar missed dates have elapsed without completion. The Endless attempt concludes and transitions to `archived` in the database.
  - **Day 3 Next Foreground Open**: In-app notice informs the user that their journey was preserved in Solo Memories, offering a direct link to view stats or start a new attempt from Day 1.

## 2. Settlement of Timing & Delivery Rules

1. **Suppression & Cancellation**:
   - If the user completes their habit (Sparks) anytime before the scheduled trigger hour (e.g., at 14:00), the scheduled notification is cancelled and no in-app reminder is displayed.
   - Late opening after the date has passed reconciles state without duplicate or stacked banner spam.
2. **Author-Only Why & Blank Handling**:
   - If the author entered a private Why during onboarding/editing, it is included in quotation marks: `Remember your why: "..."`.
   - If the Why is blank or empty, the system **never** fabricates a reason. It uses clean, neutral wording: `Take a quiet moment for yourself today: [Title]`.
3. **Platform Reality Matrix (per T41)**:
   - **Web / PWA**: There is no remote FCM or Web Push infrastructure. Delivery occurs exclusively via in-app banner/modal upon opening the app.
   - **Native Android / iOS (Capacitor)**: Local notifications (`@capacitor/local-notifications`) can trigger at 20:00 local time without background network polling.
   - **Lock Screen**: The notification title is neutral; private Why can be masked if device OS privacy settings restrict sensitive notifications.
4. **Partner Isolation**:
   - The absence reminder is strictly private to the commitment author. Partners are never notified of another person's absence (nudge rules are governed separately in T44 with strict anti-spam limits).
