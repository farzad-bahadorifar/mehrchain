# T43 Decision Record

Date: 2026-11-13, Asia/Tehran.
Artifact: `design/ux/t43-absence-message-schedule/index.html` (v0.1).

## Scope & Decision

Decision: **Approved based on T36 lifecycle contract, T41 platform inventory, and owner direction**.
1. **Settled Timetable**:
   - Day 1 missed (20:00 local): First gentle Why reminder.
   - Day 2 missed (20:00 local): Second check-in reminder.
   - Day 3 (00:00 local midnight): Archival executed.
   - Day 3 foreground open: In-app archival notice linking to Solo Memories.
2. **Dynamic Suppression**: Completing the habit prior to the trigger hour immediately cancels the reminder.
3. **Blank Why Protection**: Missing Why falls back to neutral encouragement; no artificial reasons generated.
4. **Platform Reality**: Web/PWA delivers on foreground app open; Native Capacitor utilizes local scheduled notifications.
