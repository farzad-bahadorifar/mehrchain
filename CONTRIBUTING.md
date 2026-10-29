# Contributing to MehrChain

Thank you for your interest in contributing to MehrChain! 🌟

MehrChain is a mindful habit companion designed to help people commit to positive goals, track their consistency, and spark positive chain reactions through small, daily actions. Whether you're fixing a bug, improving the UI, or building a new feature — every contribution matters.

---

## Table of Contents

- [Read the Roadmap First](#read-the-roadmap-first)
- [Getting Started](#getting-started)
- [Project Architecture](#project-architecture)
- [Development Workflow](#development-workflow)
- [Code Style & Conventions](#code-style--conventions)
- [Testing](#testing)
- [Where Help is Needed](#where-help-is-needed)
- [Submitting Changes](#submitting-changes)
- [Code of Conduct](#code-of-conduct)

---

## Read the Roadmap First

Before writing code, investigating a bug, proposing UI or opening an issue:

1. Read the [active roadmap](docs/development_roadmap.md).
2. Read the [task workflow](docs/roadmap/workflow.md), applicable
   [known decisions and blockers](docs/roadmap/context.md), and
   [product direction](docs/roadmap/direction.md).
3. Choose one precise task card. Check its scope, exclusions, starting files,
   dependencies, acceptance and verification. Do not repeat an unchanged known
   blocker or treat historical observations as today's live state.
4. For UI analysis, follow the [existing-design-system wireframe contract](docs/ui_ux_discovery_plan.md).
5. Use the [question notebook](docs/roadmap/opportunities.md) for an owner topic whose
   decision is still unclear; do not create a vague executable issue.

**English-only project material:** application/UI copy, documentation, task cards,
issue/PR descriptions and authored code comments must be English. The language of
an owner chat does not change this rule. **Exception: preserve the original Persian
poem in README verbatim; do not translate or remove it.** Preserve real user-entered Unicode data
and intentional test fixtures. Original-language historical evidence may remain
in the [documented archive](docs/archives/README.md), accompanied by English references.

The task registry is the status source; generated Markdown is a view. Use the
documented local CLI. The owner currently creates GitHub issues/Project items;
do not run legacy bulk-sync scripts or change external project state automatically.

## Getting Started

### Prerequisites

| Tool | Required Version |
|------|-----------------|
| **Node.js** | 22 LTS or higher |
| **npm** | 10.x or higher |
| **Git** | 2.x or higher |

Optional:
- **Android Studio** — if you want to build/test the Android app
- **PostgreSQL** — or use [Neon](https://neon.tech/) for a free serverless database

### Setup

1. **Fork & Clone**
   ```bash
   git clone https://github.com/<your-username>/mehrchain.git
   cd mehrchain
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your database URL:
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/mehrchain?schema=public"
   JWT_SECRET="your-dev-secret-key"
   PORT=3000
   ```
   > **Tip:** Sign up for a free [Neon](https://neon.tech/) database if you don't have PostgreSQL locally.

4. **Generate Prisma Client & Run Migrations**
   ```bash
   npx prisma generate --schema=apps/mehrchain-backend/prisma/schema.prisma
   npx prisma migrate dev --schema=apps/mehrchain-backend/prisma/schema.prisma
   ```

5. **Start Development Servers**
   ```bash
   npm run dev
   ```
   This runs both servers concurrently:
   - Frontend: `http://localhost:4300`
   - Backend API: `http://localhost:3000/api`
   - Swagger Docs: `http://localhost:3000/api/docs`

6. **Run Tests**
   ```bash
   # Frontend (Vitest)
   npx nx test mehrchain-frontend

   # Backend (Jest)
   npx nx test mehrchain-backend
   ```

---

## Project Architecture

MehrChain is an **Nx monorepo** with three main packages:

```
mehrchain/
├── apps/mehrchain-frontend/    # Angular 21 (Zoneless, Signals, Capacitor)
├── apps/mehrchain-backend/     # NestJS 11 (Prisma, JWT, PostgreSQL)
└── libs/shared-data/           # Shared TypeScript interfaces
```

### Frontend (`apps/mehrchain-frontend/src/app/`)

```
core/
├── guards/          # Route guards (onboardingGuard)
├── interceptors/    # HTTP interceptors (auth, error)
├── services/        # Business logic services
└── store/           # NgRx Signal Store (CommitmentStore)

features/            # Page-level components (lazy-loaded)
├── onboarding/      # Sign-up + habit creation wizard
├── dashboard/       # Main habit tracking screen
├── chain/           # Social chain connections
├── journey/         # Heatmap calendar & history
└── profile/         # User settings & Mero customization

shared/
├── components/      # Reusable UI components (cards, modals, mero)
├── ui/              # Primitive UI components (button, badge, card)
└── directives/      # Custom directives (swipe)
```

### Backend (`apps/mehrchain-backend/src/app/`)

```
auth/                # JWT authentication, OTP email verification
commitments/         # Habit CRUD, completion tracking, archiving
users/               # User search, public profiles
mail/                # Email service (OTP dispatch)
prisma/              # Global database service
common/              # Exception filters
```

### Shared Library (`libs/shared-data/src/`)

Contains TypeScript interfaces shared across frontend and backend:
- `Commitment` — Core habit entity
- `ActivityLog` — Timeline events

Import in code:
```typescript
import { Commitment } from '@mehrchain/shared-data';
```

---

## Development Workflow

### Branch Naming

```
feature/short-description    # New features
fix/short-description        # Bug fixes
docs/short-description       # Documentation
refactor/short-description   # Code improvements
test/short-description       # Adding tests
```

### Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add streak milestone celebrations
fix: prevent duplicate habit completion on fast tap
docs: update CONTRIBUTING with architecture overview
refactor: extract onboarding steps into child components
test: add ChainService unit tests
chore: update dependencies
```

### Pull Request Process

1. Read the roadmap and select the task card before starting a branch.
2. Create a feature branch from `main`
3. Make scoped changes and record actual acceptance evidence.
4. Run checks appropriate to the change; follow the task's verification instructions.
5. Push/open a PR when authorized, linking the exact task/issue and explaining what changed and why.
6. Use English and distinguish local tests, deployment and real-device acceptance.
7. Request review; never claim unverified acceptance.

---

## Code Style & Conventions

### General

- **Language:** TypeScript (strict mode)
- **Formatter:** Prettier (auto-formats on save)
- **Linter:** ESLint with TypeScript plugin
- **Line width:** 100 characters
- **Quotes:** Single quotes
- **Semicolons:** Yes
- **Indentation:** 2 spaces

### Frontend Conventions

- Use **standalone components** (no NgModules)
- Use **Angular Signals** for reactive state (not RxJS Subjects for UI state)
- Use **`inject()`** function instead of constructor injection
- Use **Tailwind CSS classes** for styling (no inline styles or component CSS when possible)
- Import shared UI components from `shared/ui/` for buttons, badges, and cards

### Backend Conventions

- Use **DTOs** with `class-validator` decorators for all request bodies
- Use **Prisma** for all database operations (no raw SQL)
- Use **JSDoc comments** on all public service methods
- Throw appropriate NestJS exceptions (`NotFoundException`, `ForbiddenException`, etc.)
- All controller endpoints must have **Swagger decorators** (`@ApiOperation`, `@ApiResponse`)

---

## Testing

### What to Test

| Area | Framework | What to Cover |
|------|-----------|--------------|
| Frontend Services | Vitest | State mutations, computed values, API interactions |
| Frontend Components | Vitest | Rendering, user interactions, signal changes |
| Backend Services | Jest | Business logic, edge cases, error scenarios |
| Backend Controllers | Jest | Route handling, guard integration |

### Running Tests

```bash
# Run all tests
npx nx run-many -t test

# Run specific project tests
npx nx test mehrchain-frontend
npx nx test mehrchain-backend

# Run with coverage
npx nx test mehrchain-frontend -- --coverage
npx nx test mehrchain-backend -- --coverage
```

### Writing Tests

- Place test files next to the source file: `feature.ts` → `feature.spec.ts`
- Use descriptive test names: `it('should increment streak when completing a commitment')`
- Mock external dependencies (HTTP, localStorage, Prisma)
- Test both success and error paths

---

## Where Help is Needed

Use the active queue in [the roadmap](docs/development_roadmap.md), not a static feature wishlist. Read the selected task and its known constraints before offering a fix. Undefined owner topics belong in the question notebook until they have a bounded decision/output. Do not recreate completed Chain/onboarding work, replace Mero, change reward rules or introduce a new component system based on older suggestions.

---

## Submitting Changes

1. **Check existing issues** before starting work to avoid duplicates
2. **Define new scope through roadmap intake first**; follow the current owner-directed issue/Project handoff policy
3. **Keep PRs focused** — one feature or fix per PR
4. **Update tests** when changing behavior
5. **Don't break existing tests** — all CI checks must pass

---

## Code of Conduct

We are committed to providing a welcoming and inclusive experience for everyone. Please be respectful, constructive, and kind in all interactions.

- Be patient with newcomers
- Give constructive feedback
- Focus on what's best for the project and community
- Respect differing viewpoints and experiences

---

## Questions?

- Open a [GitHub Discussion](https://github.com/farzad-bahadorifar/mehrchain/discussions) for general questions
- File a [GitHub Issue](https://github.com/farzad-bahadorifar/mehrchain/issues) for bugs or feature requests
- Check the [Swagger API Docs](http://localhost:3000/api/docs) when running locally

---

*Thank you for helping make MehrChain better! Every contribution, no matter how small, helps spread kindness and positive habits. 🔥💙*
