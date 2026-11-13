# T36: Endless Third-Day Archive and Restart Attempts Lifecycle Contract

Date: 2026-11-13, Asia/Tehran.
Status: Evidenced Analysis Report.
Context references: [D-009](../context.md#d-009), [D-001](../context.md#d-001), [D-008](../context.md#d-008).
Inputs: [T35 Domain Contract](t35-finite-experience-contract.md).

## 1. Owner Intent & Principles

The owner specified:
1. **Absence means lack of completion, not lack of app visits**: Opening the app, viewing cards or visiting profile does not count as completing an intention.
2. **Canonical 2-Day Grace Timeline**:
   - If a commitment is completed on Monday, Tuesday is missed day 1, Wednesday is missed day 2.
   - At Thursday 00:00 (local account midnight), the two-day grace window has expired. The Endless habit transitions to `isArchived: true`.
3. **Restart as a Distinct Attempt from Day 1**:
   - When an archived Endless habit is restarted, it begins a **fresh attempt** with `currentDay: 0` (or 1 upon first spark) and `currentStreak: 0`.
   - The prior attempt's history, completions, and dates are preserved permanently in Memories.
   - Starting a new attempt does **not** auto-reconnect old partners (companionship requires a fresh deliberate link).
4. **Permanent Rewards (D-001)**:
   - Earned Mero color slots and unlocked palettes are permanent account assets. Archiving an attempt or restarting from day 1 **never relocks** earned colors.
5. **Finite Exclusion (T35)**:
   - Finite experiences (`totalDays > 0`) are excluded from automatic 2-day absence archival. Their streak resets, but their target remains open.

---

## 2. Canonical State Machine & Timeline

Let the user's account timezone be `TZ`.

```
[Monday] ------------------> [Tuesday] ------------------> [Wednesday] ----------------> [Thursday 00:00 TZ]
Last Completed: Day K        Missed Day 1                  Missed Day 2                   Archival Triggered!
consecutiveMissedDays: 0     consecutiveMissedDays: 1      consecutiveMissedDays: 2       isArchived = true
Status: ACTIVE               Status: ACTIVE (Grace)        Status: ACTIVE (Grace)         Status: ARCHIVED (Memory)
```

### Edge Cases Handled Deterministically:
1. **Lazy Reconciliation vs. Delayed Cron**:
   - Whether the archival is evaluated by a background cron job or lazily on the next user API request (or page load), the calculation relies on deterministic date math via `commitmentCalendar(user.timeZone, serverNow)`. If `consecutiveMissedDays >= 2`, archival is applied before any other read/write.
2. **Partial Creation Date**:
   - If an Endless habit is created on Tuesday at 16:00, Tuesday is Day 0. If not completed on Tuesday, Tuesday is missed day 1, Wednesday is missed day 2, and archival triggers on Thursday at 00:00.
3. **DST Shifts**:
   - Calculations use calendar-date distance in local calendar Gregorian parts (`localDay`), preventing 23-hour or 25-hour DST days from triggering premature or delayed archival.
4. **Completion on Same Date as Restart**:
   - If a user restarts an archived habit on Thursday at 10:00 and completes it at 10:05, the new attempt logs its first completion on Thursday, achieving `currentDay: 1` and `currentStreak: 1`.

---

## 3. Comparison: Current Code vs. Requested Contract

| Dimension | Current Implementation (`CommitmentLifecycleService`) | Proposed Attempt Lifecycle Contract |
| :--- | :--- | :--- |
| **Eligibility for Archival** | Archives any commitment with `consecutiveMissedDays >= 2` regardless of `totalDays`. | Only Endless commitments (`totalDays === -1`) are auto-archived. Finite ones preserve cumulative progress. |
| **Restore / Restart** | Existing `restoreCommitment` resets streak to 0, sets `isArchived = false`, but continues the same cumulative counter. | Explicit **"Start New Attempt"**: archives the completed/abandoned attempt as a sealed historical record, creating a fresh attempt instance with its own attempt counter starting from day 1. |
| **Partner Connections** | Auto-detaches on archive via `detach()`, creating a `ChainDisconnectReceipt`. | Preserves existing disconnect receipt behavior; restarting does not secretly reconnect old partner links. |
| **Earned Rewards (D-001)** | Already preserved in `MeroCustomizationService` / backend DB. | Contract explicitly reaffirms that earned slots remain permanent across attempts. |

---

## 4. Invariants & Storage Schema Assessment

### Invariants:
1. `attemptNumber`: Each distinct cycle of an Endless habit has a sequence number (`attempt: 1`, `attempt: 2`, etc.).
2. `effortPreserved`: An archived attempt retains `completedDaysCount`, `streakMax`, `startDate`, `endDate`, and `history` array.
3. `zeroDataLoss`: No deletion of activity logs or history occurs when starting a new attempt.

### Storage Delta Required:
Currently, `Commitment` has `isArchived: boolean`. To cleanly model attempts without schema breaking:
- Option A (Minimal / Non-breaking): Keep the archived commitment row as the historical record (renaming title or storing `attemptId`), and create a fresh `Commitment` row with `isArchived: false` for the new attempt.
- Option B: Add an `attempts` relation in Prisma.
*Recommendation for implementation phase*: Option A is fully backward-compatible with existing Prisma schema, requires zero data migration, and preserves all historical logs.

---

## 5. Atomic Follow-Up Mapping

1. **F1: Exclude Finite Commitments from Auto-Archival**:
   - Guard in `commitment-lifecycle.service.ts`: `if (!habit.isArchived && habit.totalDays === -1 && state.consecutiveMissedDays >= 2)`.
2. **F2: New Attempt Endpoint / Service Method**:
   - Method `startNewAttempt(commitmentId: string)`: creates a fresh active commitment row inheriting title, category, and why, while leaving the existing archived row intact for Memories.
3. **F3: Absence Notification & Warning Message (T43)**:
   - Define exact message delivery on Missed Day 1 and Missed Day 2 before Thursday 00:00 archival.
