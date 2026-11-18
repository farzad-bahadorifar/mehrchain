# Change: Acknowledge actual Chain completions

## Why
The owner-approved T33/T34 result separates support from relationships. The old
heart action follows a daily relationship allowance, even without a completion.

## What Changes
- Show Up displays real, unacknowledged linked completions and recent confirmed hearts.
- Connect owns invitation and relationship management, including private disconnects.
- The heart POST requires a completion ID and keeps the existing recipient-day cap.

## Impact
- Chain API, Prisma ledger, shared contract and Chain UI.
- Clients without an event ID fail closed. Older reads must not enable the new action.
