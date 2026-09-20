# MehrChain — Project Rules & AI Context

> This file is automatically loaded by the AI agent for every task in this repository.
> It provides project-wide context, architecture map, and coding conventions.

---

## Response Formatting Rules (RTL/LTR)

1. **Farsi text (RTL)** must always be inside `<div dir="rtl">` and `</div>` tags.
2. **Code blocks** (typescript, html, json, bash, etc.) must be **outside** `<div dir="rtl">` tags to preserve LTR formatting.
3. **Inline English terms** in Farsi text must use backticks (e.g., `ExampleClass`).
4. Farsi text must be clear, structured, and use proper punctuation.

---

## Monorepo Architecture Map

```
mehrchain/                              # Nx 22.5 Monorepo
├── apps/
│   ├── mehrchain-frontend/             # Angular 21 (Zoneless, Signals, Capacitor 8)
│   │   └── src/app/
│   │       ├── core/                   # Services, Store, Guards, Interceptors
│   │       ├── features/              # Onboarding, Dashboard, Chain, Journey, Profile
│   │       ├── shared/                # Reusable components, UI primitives, directives
│   │       └── environments/          # API URL configs (environment.ts / environment.prod.ts)
│   ├── mehrchain-backend/             # NestJS 11 REST API
│   │   ├── prisma/schema.prisma       # Database schema (PostgreSQL via Neon)
│   │   └── src/app/
│   │       ├── auth/                  # JWT auth, OTP email verification, Passport
│   │       ├── commitments/           # Habit CRUD + completion tracking
│   │       ├── users/                 # User search & public profiles
│   │       ├── mail/                  # OTP email dispatch (console fallback)
│   │       ├── prisma/                # Global DB service (PrismaClient)
│   │       └── common/filters/       # AllExceptionsFilter
│   └── mehrchain-backend-e2e/         # E2E test scaffold (empty)
├── libs/
│   └── shared-data/src/lib/           # Shared TS interfaces
│       ├── commitment.interface.ts    # Commitment type (used by frontend + backend)
│       └── activity-log.interface.ts  # ActivityLog type
├── android/                           # Capacitor Android project
├── ios/                               # Capacitor iOS project (config only)
├── docs/                              # Architecture docs, scorecard, UX eval
└── .agents/skills/                    # AI development skills (on-demand)
```

### Key Import Paths
- Shared types: `import { Commitment } from '@mehrchain/shared-data';`
- Frontend environment: `import { environment } from '../../../environments/environment';`

---

## Coding Conventions (MUST follow)

### General
- **Language**: TypeScript 5.9 (strict mode)
- **Formatter**: Prettier (100 char width, single quotes, semicolons)
- **Linter**: ESLint with TypeScript plugin
- **Indentation**: 2 spaces

### Commit Messages (Conventional Commits)
```
feat: add streak milestone celebrations
fix: prevent duplicate habit completion
docs: update architecture analysis
refactor: extract onboarding steps
test: add ChainService unit tests
chore: update dependencies
```

### Branch Naming
```
feature/short-description
fix/short-description
refactor/short-description
test/short-description
docs/short-description
```

---

## Environment & Deployment Reference

| Variable | Purpose | Default |
|----------|---------|---------|
| `DATABASE_URL` | PostgreSQL connection (Neon) | — |
| `JWT_SECRET` | JWT signing key | — |
| `PORT` | Backend HTTP port | `3000` |
| `SMTP_HOST` | Email SMTP (optional) | Console fallback |

| Platform | Service | Config File |
|----------|---------|-------------|
| Frontend | Vercel | `vercel.json` |
| Backend | Render | `render.yaml` |
| Database | Neon PostgreSQL | `prisma/schema.prisma` |
| Android | Capacitor + GitHub Actions | `capacitor.config.ts`, `.github/workflows/build-apk.yml` |

---

## Testing Commands

```bash
# Frontend (Vitest — 38 tests)
npx nx test mehrchain-frontend

# Backend (Jest — 22 tests)
npx nx test mehrchain-backend

# Both
npx nx run-many -t test

# Dev servers (concurrent)
npm run dev
# → Frontend: http://localhost:4300
# → Backend:  http://localhost:3000/api
# → Swagger:  http://localhost:3000/api/docs
```

---

## Known Architecture Decisions

1. **State Management**: NgRx Signal Store with Facade pattern (`CommitmentStore` → `CommitmentService`)
2. **Offline Strategy**: Optimistic local-first updates in localStorage, background sync to API when online
3. **Auth**: JWT (30-day expiry) with OTP email verification; local dev fallback with `local_`/`mock_` token prefixes
4. **Chain Feature**: Full design spec at `docs/chain_feature_spec.md`. New models: `ChainConnection` (support links) + `ChainInvite` (invite flow). Replaces old `ChainRequest`. Key rules: passive feed (no push), auto-notify on completion, 2-day freeze then auto-archive, heart icon-only reaction, contextual nudge button.
5. **PWA**: Angular NGSW with `freshness` strategy for API data (3s timeout, 3-day cache)
6. **Mobile**: Capacitor 8 with Ionic Angular (`mode: 'ios'`), Android builds via GitHub Actions CI
7. **Mero Mascot**: Personality section removed. Customization limited to nickname + glow theme + dark/light mode until custom illustrations exist.
