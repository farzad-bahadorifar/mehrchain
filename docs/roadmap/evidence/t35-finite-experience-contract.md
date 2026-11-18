# T35: Finite Experiences versus Endless Commitments Domain Contract

Date: 2026-11-13, Asia/Tehran.
Status: Evidenced Analysis Report.
Context references: [D-009](../context.md#d-009), [D-001](../context.md#d-001), [D-008](../context.md#d-008).

## 1. Owner Intent & Product Background

During the 2026-10-29 product direction review and subsequent owner clarification on 2026-11-13, the owner specified:
1. **Not every entry is a habit**: Some commitments are finite experiences (e.g., a 1-time shared event, a 3-day fast, a 21-day challenge), whereas others are ongoing, open-ended routines ("Endless Journey").
2. **Behavioral clarity (inspired by best-in-class product design such as Duolingo and habit benchmarks)**:
   - In modern progressive apps, cumulative progress along a finite track is distinct from consecutive streak. A broken streak should not forfeit accumulated progress on a finite goal.
   - A finite experience should not be wiped out or abruptly archived merely due to a 2-day pause; its streak may reset to 0, but the target (e.g., 2 out of 3 days done) remains intact for the user to finish.
   - Conversely, an Endless habit represents an active ongoing daily rhythm. Two consecutive missed dates signal abandonment of that attempt, triggering an archival transition on the third morning while preserving the historical memory.
3. **Companionship is pairwise and low-pressure**: Multiple partners can link to the same experience independently without forcing a group chat or synchronous calendar dates.

---

## 2. Inspected Code Baseline & Current Discrepancies

Source inspection of the current code reveals:

| Component / Layer | Inspected File | Current Behavior | Gap vs Requested Contract |
| :--- | :--- | :--- | :--- |
| **Commitment Model** | `libs/shared-data/src/lib/commitment.interface.ts` | `totalDays: number` (`-1` = Endless, `> 0` = finite). Has `currentDay` (cumulative) and `currentStreak` (consecutive). | Model can already represent cumulative count vs streak, but lacks distinct semantic categorization (`experience` vs `habit`). |
| **Calendar State Calculation** | `apps/mehrchain-backend/src/app/commitments/commitment-calendar.ts` | `isGoalReached: commitment.totalDays !== -1 && commitment.currentDay >= commitment.totalDays`. `currentStreak` checks 1-day gap. | Sound mathematical basis: correctly distinguishes cumulative `currentDay` from consecutive `currentStreak`. |
| **Lifecycle & Archival** | `apps/mehrchain-backend/src/app/commitments/commitment-lifecycle.service.ts` (`line 33`) | `if (!habit.isArchived && !state.isGoalReached && state.consecutiveMissedDays >= 2)` -> archives the commitment! | **Critical Gap**: Current code indiscriminately archives ANY commitment after 2 missed days, even finite ones that are in-progress. |
| **Onboarding Selection** | `apps/mehrchain-frontend/src/app/features/onboarding/steps/details-step.html` | Provides "Endless Journey" (`-1`) and "Custom Days" (`1..N`). | Uses generic "Custom Days" rather than explaining the distinction between a finite experience and an ongoing habit. |
| **Chain Linking** | `apps/mehrchain-backend/src/app/chain/chain.service.ts` | Links 1 user commitment to 1 partner commitment. | Pairwise linking already matches the independent partner requirement. |

---

## 3. The Contract: Cumulative Completions vs. Consecutive Streaks

The contract formalizes four distinct archetype targets:

| Archetype | `totalDays` | Terminology / Label | Completion Criteria | Absence Behavior | Streak Meaning |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Single Experience** | `N = 1` | "One-Time Spark" / "Shared Moment" | `currentDay >= 1` (immediately completes). | Never archived by inactivity; waits for the single spark. | Always 1 upon completion. |
| **Sprint Experience** | `N = 3` (or short `N < 7`) | "3-Day Sprint" / "Short Experience" | `currentDay >= 3` cumulative completions. | Streak resets to 0 after 1 missed date, but goal is **NOT** archived on day 3; remains open until completed or manually archived. | Consecutive completions. |
| **Milestone Program** | `N = 21` (or custom `N`) | "21-Day Milestone" | `currentDay >= N` cumulative completions. | Streak resets to 0 if an account date is missed, but accumulated progress (e.g. 14/21) persists. | Consecutive completions (essential for D-001 21-day color reward). |
| **Endless Intention** | `N = -1` | "Endless Journey" | Open-ended; never auto-completes. | Archived on the third morning after 2 consecutive missed account dates. Old effort preserved as an archived attempt in Memories. | Measures the length of the current active attempt. |

### Invariants:
1. `currentDay` increments strictly once per account date on which the user marks completion.
2. `currentStreak` increments if completed on consecutive calendar dates in the user's timezone; resets to `0` when an account date is missed.
3. For `totalDays > 0`, finishing occurs when `currentDay === totalDays`. Upon reaching this threshold, `isGoalReached = true` and the status transitions to `COMPLETED`.
4. Reward Invariant (D-001): The first custom Mero color slot requires `21 consecutive completed days` on **one habit** (`currentStreak >= 21`). Cumulative nonconsecutive days do not substitute for this streak milestone.

---

## 4. Solo Use & Multi-Partner Independence

1. **Solo Use**:
   - The user creates and completes their finite experience or Endless habit entirely on their own. No companion is required.
2. **Pairwise Linking (No Group Entity)**:
   - If User A connects their 3-day sprint to Partner B (who has a 3-day sprint) and also to Partner C (who has an Endless habit), these are two separate, independent `ChainConnection` records.
   - There is **no shared group entity** and **no group chat**.
   - Partner B and Partner C have no visibility into each other.
   - If Partner B finishes their 3-day sprint early, User A's connection to Partner C remains unaffected.
3. **Asynchronous Calendar Dates**:
   - Partner completion dates need not coincide. Timezones and daily completion schedules are evaluated in each participant's own local account calendar.

---

## 5. UI Evaluation: Are Screen Changes Required?

| Screen | Current State | Required Change? | Rationale |
| :--- | :--- | :--- | :--- |
| **Onboarding Details Step** | Radio buttons for "Endless Journey" and "Custom Days". | No breaking change required immediately. | Microcopy in `details-step.html` already supports numeric input. A cosmetic subtitle polish (e.g. "Choose a milestone or an ongoing journey") can be introduced smoothly without breaking schemas. |
| **Home Commitment Card** | Displays `totalDays` progress bar or Endless indicator. | No structural change required. | Progress bar fills `currentDay / totalDays`. Spark button remains consistent. |
| **Journey Overview** | Currently displays calendar and flat history list. | **Yes** (owned by T38-T40). | Needs the agreed Memories destination to house completed finite experiences and past Endless attempts separately. |
| **Chain Card** | Shows partner habit and completion status. | Handled by T34 & T49. | Show up / Connect views already separate completion acknowledgements. |

---

## 6. Atomic Follow-Up Mapping

To implement this contract cleanly without monolithic scope:

1. **Backend Lifecycle Guard Update (F1)**:
   - Scope: In `commitment-lifecycle.service.ts`, adjust the automatic archival condition so that only `habit.totalDays === -1` (Endless) is subject to 2-day absence archival. Finite commitments (`totalDays > 0`) should reset streak to 0 but remain active until `currentDay >= totalDays` or manually archived.
   - Input: This report and `commitment-lifecycle.service.ts`.
   - Verification: Unit tests verifying that a 3-day commitment with 2 missed dates stays unarchived with `currentStreak: 0`, while an Endless commitment archives after 2 missed dates.

2. **Memories Destination Wireframes (T38, T39, T40)**:
   - Scope: Render past completed finite experiences and archived Endless attempts in Journey.
   - Inputs: T35 contract, T36 attempt lifecycle, T37 joint outcomes.
