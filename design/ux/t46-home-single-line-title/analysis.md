# T46: Home Single-Line Commitment Title Analysis

Date: 2026-11-13, Asia/Tehran.
Scope: Home commitment card title row (`apps/mehrchain-frontend/src/app/shared/components/commitment-card/commitment-card.html`).

## 1. Context & Motivation

In the current implementation, `commitment-card.html` renders:
```html
<h3 class="min-w-0 text-lg font-bold text-foreground break-words">{{ commitment().title }}</h3>
```
When user titles are lengthy (e.g. 50+ characters) or contain unbroken words, the title wraps across 3 to 5 lines. On small mobile viewports (320px - 390px), this causes:
1. Significant card height inflation and visual clutter on Home.
2. Distortion or vertical squeezing of the "Details" button.
3. Inconsistent spacing before the streak and action buttons.

## 2. Design System & Modern UX (Duolingo benchmark)

Top modern habit and learning interfaces (such as Duolingo unit cards and Fabulous habit cards) maintain a clean, compact single-line primary title on the feed card:
- Truncate with an ellipsis (`overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`).
- Provide accessible native `title` attribute for tooltips on hover and screen-reader full announcement.
- Expanding the card via "Details" (or tapping the truncated title) displays the full unbroken title within the details disclosure section.

## 3. Behavioral Scenarios Tested

1. **Short title (12 characters)**: e.g. "Morning Yoga". Displays cleanly without truncation.
2. **Long spaced title (75 characters)**: e.g. "Drink at least 2 liters of fresh filtered water before dinner every day". Truncates cleanly on 1 line; reveals full text when clicking Details.
3. **Unbroken long title (85 characters)**: e.g. "supercalifragilisticexpialidocious_mindfulness_deep_breathing_session_routine_2026". Truncates without horizontal overflow or word-splitting glitches.
4. **200% text zoom**: The single-line title gracefully clips with ellipsis; "Details" button remains completely reachable and the "Spark" button remains comfortably enclosed within card boundaries.
