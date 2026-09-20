# MehrChain Frontend — AI Context & Rules

> Loaded automatically when working on `apps/mehrchain-frontend/`.

---

## Response Formatting (RTL/LTR)

1. Farsi text inside `<div dir="rtl">`, code blocks outside.
2. Inline English terms in backticks.

---

## Component & File Map

### Feature Pages (lazy-loaded via `app.routes.ts`)

| Feature | Route | Component File | Template | Guard |
|---------|-------|---------------|----------|-------|
| **Onboarding** | `/` | `features/onboarding/onboarding.ts` | `onboarding.html` | — |
| **Dashboard** | `/dashboard` | `features/dashboard/dashboard.ts` | `dashboard.html` | `onboardingGuard` |
| **Chain** | `/chain` | `features/chain/chain.ts` | `chain.html` | `onboardingGuard` |
| **Journey** | `/journey` | `features/journey/journey.ts` | `journey.html` | `onboardingGuard` |
| **Profile** | `/profile` | `features/profile/profile.ts` | `profile.html` | `onboardingGuard` |

### Core Services (`core/services/`)

| Service | File | Responsibility |
|---------|------|---------------|
| `AuthService` | `auth.service.ts` | Login, register, OTP verify, logout, session persistence |
| `CommitmentService` | `commitment.service.ts` | Facade over CommitmentStore (CRUD, archive, restore) |
| `ChainService` | `chain.service.ts` | Chain connections, invite links, heart react, nudge (**needs rewrite: localStorage → API, see `docs/chain_feature_spec.md`**) |
| `MeroService` | `mero.service.ts` | Mascot emotional state (idle/happy/celebrating/etc.) |
| `MeroCustomizationService` | `mero-customization.service.ts` | Glow themes, nickname (**Personality section removed**) |
| `ThemeService` | `theme.service.ts` | Dark/light/system mode |
| `NotificationService` | `notification.service.ts` | Capacitor local notifications |

### State Management (`core/store/`)

| Store | File | Pattern |
|-------|------|---------|
| `CommitmentStore` | `commitment.store.ts` | NgRx Signal Store (`signalStore()` with `withState`, `withComputed`, `withMethods`, `withHooks`) |

**CommitmentStore API:**
- State: `commitments`, `archivedCommitments`, `isLoading`, `activeUserId`
- Computed: `hasAnyCommitment`, `overallStreak`
- Methods: `loadForUser()`, `syncWithBackend()`, `addCommitment()`, `completeCommitment()`, `updateCommitment()`, `removeCommitment()`, `fetchArchivedCommitments()`, `restoreCommitment()`, `permanentDeleteCommitment()`, `resetState()`, `clearUserStorage()`
- Hooks: `onInit` → auto-saves to localStorage via `effect()`

### Shared Components (`shared/components/`)

| Component | File | Purpose |
|-----------|------|---------|
| `CommitmentCardComponent` | `commitment-card/commitment-card.ts` | Habit card with progress, streak, actions |
| `MeroComponent` | `mero/mero.ts` | Animated mascot with glow themes |
| `HeatmapCalendar` | `heatmap-calendar/heatmap-calendar.ts` | Monthly grid tracker |
| `NewCommitmentModal` | `new-commitment-modal/new-commitment-modal.ts` | Create habit modal |
| `EditCommitmentModal` | `edit-commitment-modal/edit-commitment-modal.ts` | Edit habit modal |
| `DeleteConfirmationModal` | `delete-confirmation-modal/delete-confirmation-modal.ts` | Soft-delete confirmation |
| `QrCodeComponent` | `qr-code/qr-code.ts` | Chain invite QR code |

### UI Primitives (`shared/ui/`) — CVA-based

| Component | Variants | Sizes |
|-----------|----------|-------|
| `McButtonComponent` | primary, secondary, outline, ghost, danger | sm, md, lg, icon |
| `McBadgeComponent` | primary, neutral, outline, success | xs, sm |
| `McCardComponent` | elevated, flat, interactive | none, sm, md, lg |

### Directives (`shared/directives/`)

| Directive | Purpose |
|-----------|---------|
| `SwipeDirective` | Touch swipe left/right detection |

### Guards & Interceptors (`core/`)

| Name | Type | File | Behavior |
|------|------|------|----------|
| `onboardingGuard` | `CanActivateFn` | `guards/onboarding-guard.ts` | Redirects to `/` if not authenticated |
| `authInterceptor` | `HttpInterceptorFn` | `interceptors/auth.interceptor.ts` | Attaches `Bearer` token (skips local/mock tokens) |
| `errorInterceptor` | `HttpInterceptorFn` | `interceptors/error.interceptor.ts` | Normalizes HTTP errors to friendly messages |

---

## Angular 21 Conventions (MUST follow)

1. **Standalone components only** — no NgModules for components
2. **Use `inject()` function** — not constructor injection
3. **Use Angular Signals** (`signal()`, `computed()`, `effect()`) for reactive state
4. **Use `input()` / `output()` / `model()`** — not `@Input()` / `@Output()` decorators
5. **Use new control flow** — `@if`, `@for`, `@switch` — not `*ngIf`, `*ngFor`
6. **Lazy load routes** with `loadComponent: () => import(...)`
7. **Import shared types** from `@mehrchain/shared-data`
8. **Template files** separate from component (`.html` + `.ts` + `.css`)

---

## Design Tokens (Tailwind CSS 4)

### Colors (HSL CSS Variables)
| Token | Light | Dark |
|-------|-------|------|
| `--color-primary` | `hsl(180 100% 25%)` (Teal) | `hsl(172 75% 42%)` |
| `--color-accent` | `hsl(180 100% 31%)` | `hsl(172 80% 50%)` |
| `--color-background` | `hsl(210 20% 98%)` | `hsl(222 47% 9%)` |
| `--color-card` | `hsl(0 0% 100%)` | `hsl(222 47% 14%)` |
| `--color-foreground` | `hsl(220 29% 17%)` | `hsl(210 40% 98%)` |
| `--color-muted` | `hsl(210 20% 96%)` | `hsl(217 33% 18%)` |
| `--color-border` | `hsl(210 20% 90%)` | `hsl(217 33% 22%)` |

### Font
- Family: `Poppins` (weights: 300, 400, 500, 600, 700)

### Border Radius
- `--radius`: `1rem` (lg=var, md=calc-2px, sm=calc-4px, 2xl=1rem, 3xl=1.5rem)

### Shadows
- `--shadow-soft`: Subtle elevation
- `--shadow-float`: Teal-tinted floating glow

### Dark Mode
- Strategy: Class-based (`darkMode: ["class"]`)
- Toggle: `ThemeService.setTheme('light' | 'dark' | 'system')`

---

## Testing (Vitest)

- Test files: `*.spec.ts` next to source files
- Run: `npx nx test mehrchain-frontend`
- Pattern: Component + service unit tests with signal assertions
