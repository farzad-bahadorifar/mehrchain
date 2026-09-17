---
name: a11y-improvements
description: >-
  Use this skill when the user asks to improve accessibility (a11y), add ARIA
  labels, fix color contrast, add keyboard navigation, or make the app more
  inclusive and screen-reader friendly.
---

# Accessibility (a11y) Improvements

MehrChain currently has minimal accessibility support. This skill provides a systematic checklist for improving a11y across all components.

## Current State

- ❌ No ARIA labels on interactive elements
- ❌ No keyboard navigation testing
- ❌ No `role` attributes on custom modals
- ❌ No `aria-live` regions for toast notifications
- ❌ No `prefers-reduced-motion` media query
- ⚠️ Teal (#008080) on white may fail WCAG AA contrast (needs verification)
- ✅ Semantic HTML used in some places (buttons, headings)

## Checklist by Component

### Modals (all 4 modals)

Files:
- `shared/components/new-commitment-modal/`
- `shared/components/edit-commitment-modal/`
- `shared/components/delete-confirmation-modal/`
- `features/onboarding/onboarding.ts` (verification + login modals)

Required:
```html
<div role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <h2 id="modal-title">{{ title }}</h2>
  <!-- content -->
  <button aria-label="Close modal" (click)="close()">✕</button>
</div>
```

- Add `role="dialog"` and `aria-modal="true"`
- Add `aria-labelledby` pointing to modal title
- Trap focus inside modal when open
- Return focus to trigger element when closed
- Close on `Escape` key

### Buttons

Files: `shared/ui/button/button.ts`, all templates

Required:
- Icon-only buttons need `aria-label`: `<button aria-label="Edit habit">✏️</button>`
- Loading state: `aria-busy="true"` and `aria-disabled="true"`
- Disabled buttons: `aria-disabled="true"` (in addition to HTML `disabled`)

### Commitment Cards

File: `shared/components/commitment-card/`

Required:
- Card container: `role="article"` with `aria-label="Habit: {{ title }}"`
- Progress bar: `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- Dropdown menu: `role="menu"` with `aria-expanded`

### Toast Notifications

Required:
- Add an `aria-live="polite"` region for non-urgent notifications
- Add an `aria-live="assertive"` region for errors
- Example: `<div aria-live="polite" class="sr-only" id="toast-region">{{ toastMessage }}</div>`

### Mero Mascot

File: `shared/components/mero/mero.ts`

Required:
- `aria-label="Mero, your mindful companion"` on the mascot container
- `role="img"` since it's decorative with meaning
- Glow animation: respect `prefers-reduced-motion`

### Forms (Onboarding + Profile)

Required:
- All `<input>` elements need associated `<label>` elements (or `aria-label`)
- Error messages need `aria-describedby` linking to the input
- Required fields need `aria-required="true"`

## Global Improvements

### Color Contrast

Check and fix these combinations:
- Primary teal text on white background → may need darker shade
- Muted text on light background → verify 4.5:1 ratio
- Use tool: https://webaim.org/resources/contrastchecker/

### Reduced Motion

Add to `apps/mehrchain-frontend/src/styles.css`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### Skip Navigation

Add to `app.html` before the router outlet:

```html
<a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-primary">
  Skip to main content
</a>
<main id="main-content">
  <router-outlet />
</main>
```

### Screen Reader Only Class

Ensure Tailwind's `sr-only` class is available (it is by default in Tailwind CSS 4).

## Rules

- Every interactive element must have an accessible name (visible label or `aria-label`)
- All images/icons must have `alt` text or `aria-hidden="true"` if decorative
- Focus must be visible on all interactive elements (`focus-visible` outline)
- Test with keyboard only (Tab, Shift+Tab, Enter, Escape, Arrow keys)

## Validation

1. Install axe: `npm install -D @axe-core/cli`
2. Run: `npx axe http://localhost:4300/dashboard --reporter=terminal`
3. Keyboard test: Navigate entire app using only keyboard
4. Screen reader test: Use NVDA (Windows) or VoiceOver (Mac)
5. Contrast check: Run all color combinations through WCAG checker
