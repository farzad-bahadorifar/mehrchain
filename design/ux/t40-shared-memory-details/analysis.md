# T40: Shared Memories by Outcome Categories Analysis

Date: 2026-11-13, Asia/Tehran.
Scope: Shared Memories destination list, category filtering, detail view, and reconnection flow.

## 1. Context & Contract Alignment

Per T37 (Shared Experience Outcomes) and D-008/D-009:
- Shared Memories categorizes pairwise history into three canonical, neutral categories:
  1. **Ongoing**: Active chains where at least one participant has not yet finished, or an Endless chain is actively progressing. If Participant A reaches their finite goal (e.g., 5/5 days) while Participant B is at 4/5 days, the pair remains in **Ongoing** until B finishes or the chain is closed. Premature joint success is strictly prohibited.
  2. **Successfully Finished**: Both participants reached their agreed finite milestones (e.g., both 21/21 days).
  3. **Left Unfinished**: Either partner disconnected, or an Endless chain concluded following an unrecovered 2-day absence.
- **Privacy Invariants**:
  - The partner's private Why and personal habit notes are never disclosed in the shared memory record.
  - Support exchanges remain anonymous in count, preserving quiet encouragement without public leaderboards or competitive metrics.
- **Pairwise Independence**: Reconnecting or inviting the partner again is an explicit, separate action generating a fresh connection link with a new unique generation ID. Historical memories and past support events are never revived into active state.

## 2. Benchmark UX Flow

- **Category Filtering**: A clean segmented tab control ("All", "Finished", "Ongoing", "Ended") allows effortless scanning.
- **List View**: Cards show habit titles, partner public display name (without `@`), outcome tag, and timeline summary.
- **Detail View**: Full pairwise breakdown including participant commitments, shared days completed, timeline range, and explicit privacy reassurance.
- **Action Flow**: Includes a dedicated "Send New Invitation Link" button that triggers a fresh invite workflow rather than mutating the archived link.
