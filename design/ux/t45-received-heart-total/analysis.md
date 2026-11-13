# T45: Anonymous +N Received-Heart Indicator Analysis

Date: 2026-11-13, Asia/Tehran.
Scope: Received heart total representation on own-habit cards.

## 1. Problem Definition & Meaning of +N

Current code displays a bare heart icon with an unadorned integer when count > 1 (e.g. `❤️ 3`), and a bare heart without any number when count is 1.
The owner intake requested:
- A clear, friendly indicator showing `+N` (such as `+1`, `+3`, `+99`) formatted as an encouraging pill.
- **Explicit semantics**: `+N` represents the **total anonymous hearts received today** on this specific commitment during the current recipient account day.
- It is **not** an "unread message counter" and **not** a "popularity rank".
- Supporter identities are strictly anonymous and withheld.

## 2. Benchmark Design Principles (Duolingo & Social Cheers)

In top-tier apps, cheers and community high-fives are styled as compact, joyful pills (`❤️ +3`) that:
1. Provide immediate positive reinforcement without intrusive banners.
2. Group cleanly into the meta row between streak and completion target.
3. Collapse or hide entirely when count is 0 to avoid empty state pressure.

## 3. Scenarios Evaluated

1. **Count = 0**: Pill is hidden.
2. **Count = 1**: Displays `+1` with heart icon.
3. **Count = 3**: Displays `+3` with heart icon.
4. **Large Count = 99+**: Displays `+99` or `+999+` without breaking layout or colliding with title/details.
5. **Recipient Day Expiry**: At local account midnight, the count resets to 0. Yesterday's count is never displayed as today's count.
