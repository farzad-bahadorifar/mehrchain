# T44: Private Partner Nudge Contract & Limit Analysis

Date: 2026-11-13, Asia/Tehran.
Scope: Controlled partner nudge contract, strict anti-spam budget across multiple partners, privacy protection, and recipient consent.

## 1. Context & Contract Alignment

Per D-008 (quiet support), D-009 (independent partners), and T43 (absence schedule):
- Historically, arbitrary nudge endpoints were deliberately disabled to prevent social pressure and notification fatigue.
- Under owner direction, a restrained check-in capability is evaluated to let partners offer gentle encouragement during an uncompleted Endless window without creating chat, pressure, or spam.
- **Strict Anti-Spam Budget**:
  - **Cap**: Maximum **1 nudge per absence period** across **ALL** partners.
  - If a user has 3 chain partners, and Partner 1 sends a nudge during Day 2 absence, the recipient's nudge quota for that window is exhausted. Partner 2 and Partner 3 see `Nudge already sent` and cannot trigger additional notifications.
  - **Eligible Window**: Day 2 absence only (between 08:00 and 20:00 local recipient time). Nudging is prohibited on Day 1 (giving the user normal space) and prohibited after Day 3 midnight archival.
- **Strict Privacy Invariant**:
  - The sender **never** sees or receives the recipient's private Why text.
  - The sender's API request and response contain only status flags (`success: true`), never habit notes or Why text.
  - The recipient receives an in-app notice displaying their own author Why (if written; clean neutral text if blank) alongside the sender's display name.
- **Recipient Consent & Opt-Out**:
  - Users have an explicit setting under Privacy: `Allow partner check-ins (On/Off)`.
  - If disabled, senders see `Check-ins disabled` and cannot send nudges.
- **Race Condition Prevention**:
  - If recipient completes their habit right before or concurrently with a nudge send, the server returns 409 Conflict (`Already completed today`) and no notification is delivered.
