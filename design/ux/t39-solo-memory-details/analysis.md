# T39: Solo Memory List and Attempt Detail Analysis

Date: 2026-11-13, Asia/Tehran.
Scope: Solo Memories destination list, detail view, and new-start flow.

## 1. Context & Contract Alignment

Per T35 (Finite vs Endless Contract) and T36 (Endless Attempt Lifecycle):
- Solo Memories contains two distinct record types:
  1. **Finite Completed Experiences**: e.g., 3-Day Sprint or 30-Day Milestone reached.
  2. **Archived Endless Attempts**: Past attempts that ended following the canonical 2-day absence rule.
- Preserved statistics: Total completed days, maximum streak achieved, start/end dates, and personal Why.
- **Starting a new attempt**: Creates a fresh active journey starting from day 1 (`attempt: N+1`). The old attempt is permanently preserved in Memories as a historical milestone.
- **Deletion vs Archival**: Deletion is a distinct, destructive action with explicit user confirmation.

## 2. Benchmark UX Flow

- **List View**: Clean summary cards indicating title, outcome status tag (Completed or Archived), completed days, and date range.
- **Detail View**: Full breakdown of the journey stats without clutter. Clear distinction between:
  - "Start New Attempt from Day 1" (Primary encouraging action)
  - "Delete This Memory" (Secondary destructive action)
- Return navigation preserves user position in the list.
