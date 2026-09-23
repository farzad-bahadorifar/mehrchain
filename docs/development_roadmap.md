# MehrChain — Development Roadmap

> From v0.9.0-preview to production-ready v1.0 and beyond.
> Updated: 2026-09-23

---

## Infrastructure (Completed ✅)

All deployment infrastructure is set up on **free-tier** services, sufficient for 200–500 test users:

| Service | Provider | Status | URL |
|---------|----------|--------|-----|
| **Frontend** | Cloudflare Pages | ✅ Live | `https://mehrchain.pages.dev` |
| **Backend API** | Render (Free) | ✅ Live | `https://mehrchain-api.onrender.com` |
| **Database** | Neon PostgreSQL (Free: 0.5 GB) | ✅ Connected | — |
| **SMTP Email** | Console fallback (Resend planned) | ⏳ Pending | — |
| **Android APK** | GitHub Actions CI | ✅ Configured | — |

> **Cost: $0/month** — No domain or paid hosting needed until 200+ users.

---

## Phase 1: Chain Engine (Priority: Critical) — 🔧 In Progress

> Build the core social feature — the heart of "Mehr" (kindness) in MehrChain.

### Backend (`chain-backend` skill)

| Task | Status | Issue | Details |
|------|--------|-------|---------|
| Prisma schema migration | ✅ Done | — | Replaced `ChainRequest` with `ChainConnection` + `ChainInvite` models |
| `ChainModule` | ✅ Done | [#2](https://github.com/farzad-bahadorifar/mehrchain/issues/2) | Controller, Service, DTOs with Swagger decorators |
| `ChainCronService` | ✅ Done | — | Daily midnight job: RESTING → FADING → DORMANT transitions |
| Auto-notify on completion | ✅ Done | — | `ChainNotificationService` updates partner feed on habit completion |
| Unit tests (ChainService + Cron) | ✅ Done | [#6](https://github.com/farzad-bahadorifar/mehrchain/issues/6) | 76 unit tests passing across all services + edge cases |
| DB migration on Neon | ✅ Auto | — | `prisma db push` runs automatically on every Render deploy |

### Frontend (`chain-frontend-integration` skill)

| Task | Status | Issue | Target Date | Details |
|------|--------|-------|-------------|---------|
| Rewrite `ChainService` | ✅ Done | [#7](https://github.com/farzad-bahadorifar/mehrchain/issues/7) | Sep 23 | localStorage → API hybrid (same pattern as `CommitmentStore`) |
| New `ChainCardComponent` | ✅ Done | [#8](https://github.com/farzad-bahadorifar/mehrchain/issues/8) | Sep 24 | Minimal card with 5 states (Completed today, Waiting, Resting, Fading, Completed Journey) |
| Remove clutter | ✅ Done | [#9](https://github.com/farzad-bahadorifar/mehrchain/issues/9) | Sep 24 | Delete: Ring the Bell, Send Love/Cheer/Nudge, emojis, demo chain & integrate ChainCardComponent |
| Unread dot on navbar | ⏳ TODO | [#10](https://github.com/farzad-bahadorifar/mehrchain/issues/10) | Sep 25 | Teal dot on Chain tab when partner has new activity |
| Invite section cleanup | ⏳ TODO | [#11](https://github.com/farzad-bahadorifar/mehrchain/issues/11) | Sep 25 | Keep link/QR sharing, use Lucide icons |

### Reference

- Full design spec: `docs/chain_feature_spec.md`
- Backend skill: `.agents/skills/chain-backend/SKILL.md`
- Frontend skill: `.agents/skills/chain-frontend-integration/SKILL.md`

---

## Phase 2: Technical Debt & Security (Priority: High) — ✅ Partially Done

> Clean up code, harden security, and reduce complexity before going live.

### Security Hardening ✅

| Task | Status | Details |
|------|--------|---------|
| CORS lockdown | ✅ Done | Strict allowed origins: `.pages.dev` + `localhost` |
| Rate limiting | ✅ Done | `@nestjs/throttler` on auth endpoints |
| JWT_SECRET check | ✅ Done | Startup fails if missing in production |
| PWA app name fix | ✅ Done | `mehrchain-frontend` → `MehrChain` in manifest + HTML title |

### Mobile & PWA UX Optimization ✅

| Task | Status | Issue | Details |
|------|--------|-------|---------|
| PWA Viewport, Zoom & Mobile Layout Fit | ✅ Done | [#18](https://github.com/farzad-bahadorifar/mehrchain/issues/18) | Disabled pinch zoom, eliminated bounce scroll (`overscroll-behavior: none`), locked height with `100dvh`, and optimized responsive onboarding & modal cards |

### Form & Commitment Validation ✅

| Task | Status | Issue | Details |
|------|--------|-------|---------|
| Custom duration validation (Zero rejection) | ✅ Done | [#19](https://github.com/farzad-bahadorifar/mehrchain/issues/19) | Disallow 0 or negative days in custom duration inputs (`NewCommitmentModal`, `EditCommitmentModal`, `DetailsStepComponent`), highlight borders in red (`border-red-500 bg-red-500/10`), display error message, and prevent saving/submitting |

### Onboarding Refactor (`onboarding-refactor` skill)

| Task | Status | Issue | Details |
|------|--------|-------|---------|
| Split `OnboardingComponent` | ⏳ TODO | [#12](https://github.com/farzad-bahadorifar/mehrchain/issues/12) | Extract 500-line god component into step components + auth modals |

### Mero Cleanup

| Task | Status | Issue | Details |
|------|--------|-------|---------|
| Remove Personality section | ⏳ TODO | [#13](https://github.com/farzad-bahadorifar/mehrchain/issues/13) | Delete Energetic/Calm/Focused selector from Profile page |
| Remove `console.log` debug calls | ⏳ TODO | [#14](https://github.com/farzad-bahadorifar/mehrchain/issues/14) | Clean up all debug logging from frontend services |

---

## Phase 3: Production Polish (Priority: High)

> This phase is simplified — no domain purchase or server migration needed.
> We already have live infrastructure on free-tier services.

| Task | Status | Issue | Details |
|------|--------|-------|---------|
| SMTP setup (Resend) | ⏳ TODO | [#17](https://github.com/farzad-bahadorifar/mehrchain/issues/17) | Free tier: 3K emails/month for real OTP emails |
| Signed APK release | ⏳ TODO | [#15](https://github.com/farzad-bahadorifar/mehrchain/issues/15) | Configure keystore for release builds via GitHub Actions |
| CI: backend tests | ⏳ TODO | [#16](https://github.com/farzad-bahadorifar/mehrchain/issues/16) | Run `npx nx test mehrchain-backend` in GitHub Actions |
| Auto-deploy on merge | ✅ Done | — | Render + Cloudflare auto-deploy on push to `main` |

---

## Phase 4: UX Polish & Design System (Priority: Medium)

> Standardize the visual language, improve accessibility, and add end-to-end tests.

### Visual Engine & Micro-Interactions (Three.js + Spark)

| Task | Status | Issue | Details |
|------|--------|-------|---------|
| Three.js On-Demand Visual Engine & Spark Button | ⏳ TODO | [#20](https://github.com/farzad-bahadorifar/mehrchain/issues/20) | Replace "I did it" with "Spark ⚡" + touch-origin particle burst, singleton WebGL renderer, lazy-loaded Three.js chunk (<1MB initial budget), 1000ms render window (0% idle GPU), and Mero mascot animation audit/calm-down |

### Design System Documentation (`design-system-docs` skill)

| Task | Details |
|------|---------|
| Document design tokens | HSL colors, shadows, radius, typography |
| Component catalog | `McButton`, `McBadge`, `McCard` variants and usage |
| Dark/light theme guide | CSS variable mapping documentation |

### Accessibility (`a11y-improvements` skill)

| Task | Details |
|------|---------|
| ARIA labels | All interactive elements, modals, forms |
| Keyboard navigation | Full tab flow through all pages |
| Motion preferences | `prefers-reduced-motion` media query for animations |
| Color contrast | WCAG AA compliance check on all text |

### E2E Tests

| Task | Details |
|------|---------|
| API integration tests | Supertest in `mehrchain-backend-e2e`: register → verify → create habit → complete |
| Chain flow test | Create invite → accept → complete → verify feed update → miss 3 days → verify dormant |

---

## Phase 5: Future Growth (Priority: Low — Post v1.0)

> Expand to international audiences and add real-time features.

### Internationalization (`i18n-setup` skill)

| Task | Details |
|------|---------|
| Install Transloco | `@jsverse/transloco` setup |
| Extract strings | All UI text to `en.json` |
| Add Farsi | `fa.json` with RTL layout switch |
| Language switcher | In Profile settings |

### WebSocket Real-Time

| Task | Details |
|------|---------|
| NestJS Gateway | WebSocket gateway for chain activity broadcasts |
| Live feed updates | Chain page updates without refresh when partner completes |
| Typing/presence | Optional: show when chain partner is active in app |

---

## Version Milestones

| Version | Phase | Key Deliverable |
|---------|-------|-----------------|
| **v0.9.1** | Phase 1 | Chain backend API + frontend redesign complete |
| **v0.9.2** | Phase 2 | Onboarding refactored + remaining security items |
| **v1.0.0** | Phase 3 | SMTP live, signed APK, CI tests passing |
| **v1.1.0** | Phase 4 | Design system documented, a11y compliant, E2E tests |
| **v1.2.0** | Phase 5 | Multi-language support (EN + FA) |
