---
name: i18n-setup
description: >-
  Use this skill when the user asks to add internationalization (i18n),
  multi-language support, or translation infrastructure to the MehrChain
  application. Covers both frontend and backend string externalization.
---

# Set Up Internationalization (i18n)

MehrChain currently has all UI strings hardcoded in English. This skill guides setting up multi-language infrastructure.

## Current State

- All UI text is hardcoded in HTML templates and TypeScript files
- No translation library installed
- User confirmed: "English first, multi-language in the future"
- Backend error messages are also hardcoded English

## Recommended Library: Transloco

**Why Transloco over `@angular/localize`:**
- Runtime language switching (no rebuild needed)
- Lazy-loaded translation files per route
- Works with Signals and standalone components
- Active community and Angular 21 support

## Implementation Steps

### Step 1: Install Transloco

```bash
npx nx g @jsverse/transloco:ng-add --project=mehrchain-frontend
```

Or manual:
```bash
npm install @jsverse/transloco
```

### Step 2: Configure Provider

In `apps/mehrchain-frontend/src/app/app.config.ts`:

```typescript
import { provideTransloco, TranslocoModule } from '@jsverse/transloco';
import { TranslocoHttpLoader } from './transloco-loader';

providers: [
  provideTransloco({
    config: {
      availableLangs: ['en'],  // Start with English only
      defaultLang: 'en',
      reRenderOnLangChange: true,
      prodMode: environment.production,
    },
    loader: TranslocoHttpLoader,
  }),
]
```

### Step 3: Create Translation Files

```
apps/mehrchain-frontend/src/assets/i18n/
├── en.json       # English (primary)
└── fa.json       # Farsi (future)
```

**`en.json` structure:**
```json
{
  "onboarding": {
    "welcome": {
      "title": "Welcome to MehrChain",
      "subtitle": "Your mindful habit companion"
    },
    "categories": {
      "health": "Health",
      "growth": "Growth",
      "community": "Community",
      "environment": "Environment"
    }
  },
  "dashboard": {
    "overallStreak": "Overall Streak",
    "addHabit": "Add New Habit",
    "completed": "I did it today!"
  },
  "chain": {
    "title": "Chain",
    "inviteFriend": "Invite a Friend",
    "noChains": "No chains yet"
  },
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit"
  }
}
```

### Step 4: Migrate Templates

Replace hardcoded strings with `transloco` pipe:

**Before:**
```html
<h1>Welcome to MehrChain</h1>
```

**After:**
```html
<h1>{{ 'onboarding.welcome.title' | transloco }}</h1>
```

Or in TypeScript:
```typescript
import { TranslocoService } from '@jsverse/transloco';

private transloco = inject(TranslocoService);
const title = this.transloco.translate('dashboard.overallStreak');
```

### Step 5: Migrate Incrementally

Prioritize by page:
1. `shared/` components (buttons, modals, cards)
2. `features/dashboard/`
3. `features/onboarding/`
4. `features/chain/`
5. `features/journey/`
6. `features/profile/`

### Step 6: Backend Messages (Future)

Backend error messages can be externalized later. For now, keep them in English — the `AllExceptionsFilter` already standardizes them.

## Rules

- Translation keys use dot notation: `section.subsection.key`
- All new UI strings must use Transloco from the start
- Keep `en.json` as the single source of truth
- Do NOT add other languages until the English file is complete

## Validation

1. Run: `npx nx test mehrchain-frontend`
2. Verify: App renders with all text from `en.json`
3. Verify: No hardcoded strings remain in migrated templates
4. Future: Add `fa.json` and test language switch
