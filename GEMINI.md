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
| `RESEND_API_KEY` | Resend email API key (optional) | Console fallback |
| `MAIL_FROM` | Sender email address | `MehrChain <onboarding@resend.dev>` |

| Platform | Service | Config File |
|----------|---------|-------------|
| Frontend | Cloudflare Pages | — (auto-deploy from `main`) |
| Backend | Render | `render.yaml` |
| Database | Neon PostgreSQL | `prisma/schema.prisma` |
| Android | Capacitor + GitHub Actions | `capacitor.config.ts`, `.github/workflows/build-apk.yml` |

---

## Testing Commands

```bash
# Frontend (Vitest — 105 tests across 24 suites)
npx nx test mehrchain-frontend

# Backend (Jest — 80 tests across 10 suites)
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
3. **Auth**: JWT (30-day expiry) with OTP email verification; local dev fallback with `local_`/`mock_` token prefixes. OTP auto-filled from `previewCode` until real email domain is configured.
4. **Chain Feature**: Full design spec at `docs/chain_feature_spec.md`. Models: `ChainConnection` (support links) + `ChainInvite` (invite flow). Key rules: passive feed (no push), auto-notify on completion, 2-day freeze then auto-archive, heart icon-only reaction, contextual nudge button.
5. **PWA**: Angular NGSW with `freshness` strategy for API data (3s timeout, 3-day cache)
6. **Mobile**: Capacitor 8 with Ionic Angular (`mode: 'ios'`), Android builds via GitHub Actions CI
7. **Mero Mascot**: Customization limited to nickname + 21-day custom glow unlock. No personality selector. No color swatch grid.
   - **Official asset**: `apps/mehrchain-frontend/public/assets/mero.png` — a 3D-rendered penguin/chick character with teal body and warm yellow glowing belly
   - **NEVER** replace Mero with emoji, CSS circles, hand-drawn SVG faces, or any non-official illustration
   - **States** (idle/happy/celebrating/sleepy/waiting/missing/content) are CSS class overlays only — same underlying PNG
   - **Belly glow** is a CSS radial-gradient overlay positioned at `bottom: 16%` of the container
   - **Badges**: Must use Lucide icons only — NEVER generic emoji or Mero face drawings as badge icons
8. **Language**: All UI, emails, and user-facing text must be **English only**. No Farsi/Persian in the application. i18n planned for v1.2+.
9. **Design**: Minimal — no external emoji (Lucide icons or Mero-based only), short text, no clutter.
10. **Commitment Duration**: Two options — "Endless Journey" (no end date) + Custom (user-defined days).
11. **Spark Button**: "I did it" renamed to "Spark" with CSS animation. Three.js particle burst deferred to v1.1.

---

## Task Management & GitHub Lifecycle Protocol

Always follow this lifecycle protocol for any task worked on in this project:

### Phase 1: Before Starting a Task
1. **Check Roadmap**: First inspect `docs/development_roadmap.md` to check if the task already exists.
2. **If Task Exists in Roadmap**:
   - Retrieve its GitHub Issue number (e.g., `#31`).
   - Update its GitHub Project Board item status to `In progress` (or `Ready`).
   - Update `docs/development_roadmap.md` status if needed (e.g. `🔄 In Progress`).
3. **If Task Does NOT Exist in Roadmap**:
   - Create a new GitHub Issue using `node scripts/create-task.js "<Title>" "<Body>" --open`.
   - Add the task to `docs/development_roadmap.md` under the appropriate Sprint/Phase section with status `🔄 In Progress` and link to the newly created issue.
   - Add the issue to the GitHub Project Board with status `In progress` and appropriate priority/dates.

### Phase 2: Finishing a Task ("Task it" / "Log task" / "Track task" / "Close task" / "تسک‌اش کن")
1. **Close GitHub Issue & Update Project**:
   - Close the issue as completed (`state: closed`, `state_reason: 'completed'`).
   - If issue was created on the fly, run `node scripts/create-task.js "<Title>" "<Body>"`.
   - Move the task to `Done` status on the GitHub Project Board.
2. **Update Roadmap Documentation**:
   - Mark the task status as `✅ Done` in `docs/development_roadmap.md`.
   - Ensure the task row links to the GitHub issue (e.g. `[#31](https://github.com/farzad-bahadorifar/mehrchain/issues/31)`).
   - Record completion date and relevant notes.
3. **Commit & Push**:
   - Commit roadmap updates: `git commit -am "docs: update roadmap with Issue #XX"`
   - Push to GitHub: `git push origin main`


