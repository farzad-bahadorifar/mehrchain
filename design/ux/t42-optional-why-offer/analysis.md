# T42: Voluntary Why Offer After Endless Progress Analysis

Date: 2026-11-13, Asia/Tehran.
Scope: In-app voluntary prompt offering personal Why entry after sustained Endless habit progress.

## 1. Context & Contract Alignment

Per T35 (Finite vs Endless Contract) and D-011/D-009:
- In Endless journeys (`totalDays === -1`), defining a personal Why during initial onboarding is optional. Many users skip it to lower initial friction.
- Once consistency is established, asking for the personal Why anchors the commitment and provides intrinsic motivation during future absences (see T43).
- **Exact Numeric Threshold**:
  - **3 Completed Days**: An active Endless attempt that reaches 3 completed Sparks triggers eligibility. Days 1 and 2 do not show the prompt.
- **Suppression Invariants**:
  - If the author already provided a non-empty Why during creation or prior editing, the offer is **100% suppressed**.
  - Blank or sample placeholder text is never treated as a real reason and never displayed as fabricated motivation.
- **Dismissal & Skip Policy**:
  - Tapping "Maybe later" dismisses the prompt immediately for the remainder of this attempt.
  - The user can always add, edit, or clear their personal Why at any time through the standard habit settings sheet.
- **Privacy Invariant**:
  - Personal Why is **strictly private to the author**. Under no circumstances is the Why shared with chain partners or surfaced on public endpoints.
