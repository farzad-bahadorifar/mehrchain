# T38: Compact Journey Entry into Solo and Shared Memories Analysis

Date: 2026-11-13, Asia/Tehran.
Scope: Journey page navigation structure (`apps/mehrchain-frontend/src/app/features/journey/`).

## 1. Background & Problem Statement

Currently, `journey.html` displays:
1. Quick stats summary.
2. 30-day activity calendar.
3. An infinite linear scroll of all past completed habits and archived attempts.

As users complete multiple habits and endeavors over time, this flat inline list balloons in length, forcing excessive scrolling and obscuring the calendar.

## 2. Solution: Profile A Destination Pattern for Journey

Just as Profile A moved settings, badges, and colors from a massive single scroll into clean destination routes (`/profile/badges`, `/profile/colors`), Journey adopts the same pattern:
- **Journey Overview**: Retains summary statistics and the monthly activity calendar, plus a high-level destination card: **"Memories"** (with summary count, e.g. "4 memories →").
- **Memories Destination**: Houses two clear dedicated views:
  - **Solo Memories**: Past completed finite experiences and archived Endless attempts (T39).
  - **Shared Memories**: Shared endeavor outcomes (Ongoing, Successfully finished, and Left unfinished per T40).
- **Return Path**: Simple, discoverable "← Back to Journey Overview" returns smoothly without losing state.

## 3. Responsive & Device Accessibility

- Tested at 320px, 390px, and desktop viewports.
- The overview fits comfortably above the fold on mobile.
- Lists within the Memories destination can scroll naturally without bloating the overview.
