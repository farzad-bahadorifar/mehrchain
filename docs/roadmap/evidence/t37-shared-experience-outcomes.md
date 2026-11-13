# T37: Joint Chain Success and Unfinished Memory Outcomes Contract

Date: 2026-11-13, Asia/Tehran.
Status: Evidenced Analysis Report.
Context references: [D-009](../context.md#d-009), [D-008](../context.md#d-008).
Inputs: [T35 Domain Contract](t35-finite-experience-contract.md), [T36 Lifecycle Contract](t36-endless-attempt-lifecycle.md).

## 1. Owner Intent & Overview

The owner specified:
1. **True Joint Outcomes for Shared Experiences**:
   - In the current code, chain status is evaluated purely from the partner's side (`chainState`), meaning if the partner reaches their goal, the connection is prematurely labeled `COMPLETED` even if the user is still in progress.
   - In the requested model, shared memories have three clear neutral categories:
     - **Ongoing**: Active companions walking together.
     - **Successfully Finished**: Both linked partners reached their agreed goal (or a finite goal was fully achieved).
     - **Left Unfinished**: One or both partners ceased activity, disconnected, or archived before the goal was reached.
2. **Duolingo / Modern Habit Inspiration**:
   - In cooperative challenges (like Friends Quests), both players contribute to a shared victory. If one finishes their part early, the quest remains open and encouraging until the partner crosses the finish line.
   - No blame or guilt: If an experience ends prematurely, it is neutrally categorized as "Left Unfinished" without harsh penalizing copy.
3. **Strict Pairwise Privacy (D-008)**:
   - A partner never sees the other's personal Why or private disconnect notes.

---

## 2. Pair Outcome Matrix

Let User A and User B be connected via a `ChainConnection`.

| Pair Configuration | Scenario / Event | Outcome Category | Transition Boundary |
| :--- | :--- | :--- | :--- |
| **Finite (A) + Finite (B)** (Equal or Unequal targets) | Both A and B are in progress (`currentDay < totalDays`). | **Ongoing** | Remains in Show up / Connect view. |
| **Finite (A) + Finite (B)** | A reaches `totalDays` on Tuesday; B is at 2/5 days. | **Ongoing (A Completed, waiting for B)** | Connection remains active. A's early completion does **not** discard B. A continues to receive B's completion cards to acknowledge with hearts. |
| **Finite (A) + Finite (B)** | Both A and B have reached their respective `totalDays`. | **Successfully Finished** | Transitions into Shared Memories as `SUCCESSFUL`. Retains completion summary for both. |
| **Finite (A) + Finite (B)** | Either A or B manually disconnects before both reach goal. | **Left Unfinished** | Detaches into Shared Memories as `UNFINISHED`. Neutral disconnect receipt recorded. |
| **Endless (A) + Endless (B)** | Both completing regularly. | **Ongoing** | Continuous support cards on completion. |
| **Endless (A) + Endless (B)** | A misses 2 consecutive days -> archives on Day 3 morning (T36). | **Left Unfinished** | Detaches into Shared Memories as `UNFINISHED` for that attempt generation. B can continue Endless solo or invite a new companion. |
| **Mixed: Finite (A) + Endless (B)** | A completes their finite target (e.g. 21 days); B is active. | **Successfully Finished (for A's journey)** | Sealed into Shared Memories as a positive milestone. B continues their Endless journey. |
| **Mixed: Finite (A) + Endless (B)** | B archives due to absence before A finishes. | **Left Unfinished (Shared link ended)** | A's finite goal remains intact and active (T35). A can link to a new companion without losing their accumulated progress. |

---

## 3. Multi-Partner & Reconnect Isolation

1. **Multi-Partner Independence**:
   - If User A links Commitment 1 to Partner B and Partner C:
     - Disconnection or archival of the A-B pair has **zero side-effects** on the A-C pair.
     - Hearts sent to B do not consume C's allowance (each recipient day has its own single-heart rule).
2. **Reconnection / New Generation**:
   - Reconnecting with the same partner requires a fresh, deliberate invitation link.
   - It generates a new `generationId`, ensuring historical memories and past disconnect receipts are sealed and cannot be overwritten.
3. **Data Retention for Memories**:
   - When a connection transitions out of active state, a durable snapshot captures:
     - `partnerDisplayName` (cleaned, without `@` per T47)
     - `myHabitTitle` and `partnerHabitTitle`
     - `startDate` and `endedDate`
     - `totalCompletedDays`
     - Final category: `SUCCESSFUL` or `UNFINISHED`

---

## 4. Atomic Follow-Up Mapping

1. **F1: Joint Chain Outcome Resolver in Backend**:
   - Extend `chainState` to evaluate both `userCommitment` and `partnerCommitment`.
   - Transition to `COMPLETED` only when both endpoints have met their goal condition.
2. **F2: Shared Memories View & Cards (T40)**:
   - Provide the wireframe and component rendering the three categories: Ongoing, Successfully Finished, and Left Unfinished.
