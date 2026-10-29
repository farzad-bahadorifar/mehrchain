# Change: Implement approved Profile V2

The owner approved the existing V2 artifact on 2026-10-29 and requested completed,
independently verifiable tasks rather than partial progress across broad topics.

## What changes

- Apply the approved Aurora interface tokens, preserving the existing component system.
- Make Profile an overview with Mero and direct links to Account, Badges, Colors and Appearance.
- Route the existing real account/color/update behavior into those pages; add badge filtering/details and draft-only Mero preview.
- Make username removal deliberate and normalize unavailable-route errors without claiming a production backend repair.

## Scope and approval

Approval: owner's current chat request explicitly approves V2 and its implementation.
Reference: `design/ux/t22-profile-structure/index.html`, V0.2; no deployment, database
migration, new earning rules or Mero belly interaction is part of this change.
Home/Chain/Journey specimen data and synthetic future badges are not product features.

## Impact

Frontend Profile/routes/styles/Mero preview and username error presentation only.
Existing account APIs, color capacity/earning rules, saved-state and session guards remain.
