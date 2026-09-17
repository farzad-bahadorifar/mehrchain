---
name: onboarding-refactor
description: >-
  Use this skill when the user asks to refactor, split, or improve the
  OnboardingComponent. The current component is 500 lines and handles 7+ steps,
  sign-up, login, email verification, and forgot password all in one file.
---

# Refactor OnboardingComponent

The `OnboardingComponent` at `apps/mehrchain-frontend/src/app/features/onboarding/onboarding.ts` is 500 lines — a "God Component" that handles everything.

## Current State

- **File**: `features/onboarding/onboarding.ts` (500 lines)
- **Template**: `features/onboarding/onboarding.html`
- **Styles**: `features/onboarding/onboarding.css`
- **Steps managed**: 0-7 (Welcome, Why, Meaning, Category, Habit, Duration/Why/Reminder, SignUp, Profile)
- **Modals**: Email verification (OTP), Login, Forgot Password

## Extraction Plan

### Target Structure

```
features/onboarding/
├── onboarding.ts                  # Parent orchestrator (step management only)
├── onboarding.html                # Router/stepper template
├── onboarding.css                 # Shared animations
├── steps/
│   ├── welcome-step.ts            # Step 0: Welcome screen
│   ├── why-choose-step.ts         # Step 1: Why choose MehrChain
│   ├── meaning-step.ts            # Step 2: Meaning of MehrChain
│   ├── category-step.ts           # Step 3: Select category
│   ├── habit-step.ts              # Step 4: Pick/create habit
│   ├── details-step.ts            # Step 5: Duration, why, reminder
│   └── signup-step.ts             # Step 6-7: Create profile & sign up
└── modals/
    ├── verification-modal.ts      # OTP email verification
    ├── login-modal.ts             # Login flow
    └── forgot-password-modal.ts   # Password recovery
```

### Step-by-Step Refactor

#### 1. Create Step Components

Each step component receives the parent's signals via `input()` and emits events via `output()`:

```typescript
@Component({
  selector: 'app-category-step',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './category-step.html',
})
export class CategoryStepComponent {
  readonly categorySelected = output<string>();
  
  categories = [
    { id: 'health', label: 'Health', icon: Heart, ... },
    // ... from parent
  ];

  selectCategory(id: string) {
    this.categorySelected.emit(id);
  }
}
```

#### 2. Create Modal Components

Extract the three modals as standalone components:

```typescript
@Component({
  selector: 'app-verification-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './verification-modal.html',
})
export class VerificationModalComponent {
  readonly email = input.required<string>();
  readonly isOpen = model<boolean>(false);
  readonly verified = output<void>();
  // ... verification logic moved here
}
```

#### 3. Simplify Parent Component

The parent becomes a thin orchestrator:

```typescript
@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [
    WelcomeStepComponent, WhyChooseStepComponent, MeaningStepComponent,
    CategoryStepComponent, HabitStepComponent, DetailsStepComponent,
    SignupStepComponent, VerificationModalComponent, LoginModalComponent,
  ],
  templateUrl: './onboarding.html',
})
export class OnboardingComponent {
  step = signal(0);
  selectedCategory = signal<string | null>(null);
  selectedHabit = signal<string | null>(null);
  // ... only step management and data flow
}
```

#### 4. Update Template

Use `@switch` to render current step:

```html
@switch (step()) {
  @case (0) { <app-welcome-step (next)="nextStep()" /> }
  @case (1) { <app-why-choose-step (next)="nextStep()" (back)="prevStep()" /> }
  @case (3) { <app-category-step (categorySelected)="onCategorySelected($event)" /> }
  <!-- ... -->
}
```

## Rules

- Keep all signals in parent, pass down via `input()`, receive events via `output()`
- Each step component should be < 100 lines
- Modals are independent components with `model()` for open/close state
- Preserve all existing animations and swipe gestures
- Do NOT change any business logic — only restructure

## Validation

1. Run: `npx nx test mehrchain-frontend` — all existing tests must pass
2. Manual: Walk through all 7 onboarding steps — behavior identical
3. Manual: Test login modal, verification modal, forgot password
4. Manual: Test swipe gestures still work
5. Verify: Parent component is now < 100 lines
