# MehrChain — Development Roadmap

> From v0.9.0-preview to production-ready v1.0 and beyond.
> Updated: 2026-09-30 (8 Mehr 1405)
> Target Audience: English-speaking users

---

## 📅 Master Schedule & Timeline

### v1.0.0 Launch Sprint (8 Mehr – 16 Mehr / Oct 1–8)

| Day | Date | Focus | Tasks & GitHub Issues | Status |
|-----|------|-------|-----------------------|:------:|
| 1 | 8 Mehr (Oct 1) | 🔴 Bug Fixes | [[#30]](https://github.com/farzad-bahadorifar/mehrchain/issues/30) OTP `previewCode` auto-fill (✅) • [[#31]](https://github.com/farzad-bahadorifar/mehrchain/issues/31) Account deletion fix (✅) • [[#32]](https://github.com/farzad-bahadorifar/mehrchain/issues/32) English email template (✅) | ✅ Done |
| 2 | 9 Mehr (Oct 2) | 🟡 Profile Simplify | [[#33]](https://github.com/farzad-bahadorifar/mehrchain/issues/33) Remove color swatch grid & scroll-on-tap • Keep nickname + 21-day only | ✅ Done |
| 3 | 10 Mehr (Oct 3) | 🟡 Journey + Spark | [[#34]](https://github.com/farzad-bahadorifar/mehrchain/issues/34) Journey redesign & badges (✅) • [[#35]](https://github.com/farzad-bahadorifar/mehrchain/issues/35) "Endless Journey" + Custom duration (✅) • [[#36]](https://github.com/farzad-bahadorifar/mehrchain/issues/36) "I did it" → "Spark" + CSS animation (✅) | ✅ Done |
| 4 | 11 Mehr (Oct 4) | 🟡 Loading UX | [[#37]](https://github.com/farzad-bahadorifar/mehrchain/issues/37) Skeleton loading • Cold start message • Shorten all UI text | ✅ Done |
| 5 | 12 Mehr (Oct 5) | 🟢 New Features | [[#38]](https://github.com/farzad-bahadorifar/mehrchain/issues/38) Articles "Coming Soon" • [[#39]](https://github.com/farzad-bahadorifar/mehrchain/issues/39) What's New section & version dot | ⏳ Backlog |
| 6 | 13 Mehr (Oct 6) | 🟢 Landing + Polish | [[#40]](https://github.com/farzad-bahadorifar/mehrchain/issues/40) Landing page CTA • Direct PWA/APK links • Final text review | ⏳ Backlog |
| 7-8 | 14–15 Mehr (Oct 7-8) | 🧪 User Testing | 3-5 testers • Full flow: register → verify → habit → chain → spark | ⏳ Planned |
| 9 | 16 Mehr (Oct 8) | 📦 Launch | Tag v1.0.0 • Final deployment audit • Public release | ⏳ Planned |

### Completed Tasks (Pre-Launch & Sprint)

| Issue | Task Title | Phase | Status | Date | Notes |
|:-----:|------------|-------|:------:|:----:|-------|
| [#37](https://github.com/farzad-bahadorifar/mehrchain/issues/37) | Skeleton loading screens + cold start warmup notification + shorten UI text | v1.0 Launch Sprint | ✅ Done | Oct 3 | Skeletons for Dashboard/Chain/Journey, ColdStartService (>5s alert), Lucide icon cleanup & English text shortening |
| [#34](https://github.com/farzad-bahadorifar/mehrchain/issues/34) | Journey page redesign & badge system foundations (5 initial badges with Lucide icons) | v1.0 Launch Sprint | ✅ Done | Oct 2 | Removed duplicate profile card, added 5-badge milestone system |
| [#35](https://github.com/farzad-bahadorifar/mehrchain/issues/35) | Commitment duration — "Endless Journey" (-1) + Custom days | v1.0 Launch Sprint | ✅ Done | Oct 2 | Replaced presets with Endless Journey (-1) and Custom days across modals, onboarding, and backend |
| [#36](https://github.com/farzad-bahadorifar/mehrchain/issues/36) | Spark button — rename from "I did it" with Lucide sparkles icon & CSS pulse animation | v1.0 Launch Sprint | ✅ Done | Oct 2 | Replaced completion button with animated Spark button and completed state |
| [#33](https://github.com/farzad-bahadorifar/mehrchain/issues/33) | Profile Simplification — remove swatches grid & scroll-on-tap, keep nickname & 21-day glow | v1.0 Launch Sprint | ✅ Done | Oct 1 | Removed color swatch grid & tap tooltip, preserved 21-day custom glow reward |
| [#31](https://github.com/farzad-bahadorifar/mehrchain/issues/31) | Fix account deletion — only clear local state on backend success | v1.0 Launch Sprint | ✅ Done | Sep 30 | Fixed deleteAccount error handling & storage retention |
| [#32](https://github.com/farzad-bahadorifar/mehrchain/issues/32) | Translate OTP email template to English | v1.0 Launch Sprint | ✅ Done | Sep 30 | English dark-themed HTML/text OTP email template |
| [#30](https://github.com/farzad-bahadorifar/mehrchain/issues/30) | OTP auto-fill from previewCode | v1.0 Launch Sprint | ✅ Done | Sep 30 | Auto-fill verification code & helper message |
| [#2](https://github.com/farzad-bahadorifar/mehrchain/issues/2) | Implement ChainModule API & Prisma Migration | Phase 1 (Chain Backend) | ✅ Done | Sep 22 | Prisma models, controller & service |
| [#6](https://github.com/farzad-bahadorifar/mehrchain/issues/6) | Unit tests for ChainService + Cron | Phase 1 (Chain Backend) | ✅ Done | Sep 22 | 76 unit tests passing |
| [#7](https://github.com/farzad-bahadorifar/mehrchain/issues/7) | Rewrite ChainService frontend | Phase 1 (Chain Frontend) | ✅ Done | Sep 23 | localStorage + API hybrid sync |
| [#8](https://github.com/farzad-bahadorifar/mehrchain/issues/8) | New ChainCardComponent (5 states) | Phase 1 (Chain Frontend) | ✅ Done | Sep 24 | Minimal 5-state card component |
| [#9](https://github.com/farzad-bahadorifar/mehrchain/issues/9) | Remove Chain page clutter | Phase 1 (Chain Frontend) | ✅ Done | Sep 24 | Removed bell, love, emojis, demo chain |
| [#10](https://github.com/farzad-bahadorifar/mehrchain/issues/10) | Unread dot on Chain navbar tab | Phase 1 (Chain Frontend) | ✅ Done | Sep 25 | Activity badge indicator |
| [#11](https://github.com/farzad-bahadorifar/mehrchain/issues/11) | Invite section cleanup | Phase 1 (Chain Frontend) | ✅ Done | Sep 25 | InviteSectionComponent & Lucide icons |
| [#18](https://github.com/farzad-bahadorifar/mehrchain/issues/18) | Mobile & PWA UX optimization | Phase 2 (Mobile) | ✅ Done | Sep 24 | Viewport bounce, zoom lock, 100dvh |
| [#21](https://github.com/farzad-bahadorifar/mehrchain/issues/21) | Status bar safe area overlap | Phase 2 (Mobile) | ✅ Done | Sep 24 | Dynamic safe-area-inset-top padding |
| [#19](https://github.com/farzad-bahadorifar/mehrchain/issues/19) | Custom commitment duration validation | Phase 2 (Validation) | ✅ Done | Sep 24 | Rejection of 0 or negative days |
| [#26](https://github.com/farzad-bahadorifar/mehrchain/issues/26) | Onboarding public habit toggle | Phase 2 (Validation) | ✅ Done | Sep 27 | isPublic toggle in DetailsStepComponent |
| [#27](https://github.com/farzad-bahadorifar/mehrchain/issues/27) | UI Loading & Anti-Spam click protection | Phase 2 (UX) | ✅ Done | Sep 27 | Loading spinners & request debouncing |
| [#28](https://github.com/farzad-bahadorifar/mehrchain/issues/28) | Fix Chain Invite URL + OTP + Account Deletion | Phase 3 (Stability) | ✅ Done | Sep 28 | Capacitor URL fallback, auth hardening |
| [#22](https://github.com/farzad-bahadorifar/mehrchain/issues/22) | Refactor & Split OnboardingComponent | Phase 2 (Refactor) | ✅ Done | Sep 27 | Step components + auth modals (closed #5, #12) |
| [#13](https://github.com/farzad-bahadorifar/mehrchain/issues/13) | Remove Mero Personality section | Phase 2 (Cleanup) | ✅ Done | Sep 24 | Profile cleanup & tests verified |
| [#14](https://github.com/farzad-bahadorifar/mehrchain/issues/14) | Remove console.log debug calls | Phase 2 (Cleanup) | ✅ Done | Sep 24 | Codebase cleanup |
| [#24](https://github.com/farzad-bahadorifar/mehrchain/issues/24) | Setup SMTP (Resend) | Phase 3 (Stability) | ✅ Done | Sep 27 | Free tier: 3K emails/month (closed #17) |
| [#23](https://github.com/farzad-bahadorifar/mehrchain/issues/23) | Add backend tests to CI pipeline | Phase 3 (Stability) | ✅ Done | Sep 27 | GitHub Actions backend test step (closed #16) |
| [#25](https://github.com/farzad-bahadorifar/mehrchain/issues/25) | Signed Release APK (GitHub Actions) | Phase 3 (Mobile) | ✅ Done | Sep 27 | Keystore signing CI workflow (closed #15) |

---

## Infrastructure (Completed ✅)

All deployment infrastructure is set up on **free-tier** services, sufficient for 200–500 test users:

| Service | Provider | Status | URL |
|---------|----------|--------|-----|
| **Frontend** | Cloudflare Pages | ✅ Live | `https://mehrchain.pages.dev` |
| **Backend API** | Render (Free) | ✅ Live | `https://mehrchain-api.onrender.com` |
| **Database** | Neon PostgreSQL (Free: 0.5 GB) | ✅ Connected | — |
| **SMTP Email** | Resend API + Console Fallback | ⚠️ Needs real domain | `https://resend.com` |
| **Android APK** | GitHub Actions CI | ✅ Configured | — |
| **Landing Page** | GitHub Pages | ✅ Live | `https://farzad-bahadorifar.github.io/mehrchain/` |

> **Cost: $0/month** — No domain or paid hosting needed until 200+ users.
> **Note:** Resend requires a verified custom domain for email delivery. Until then, OTP codes are auto-filled via `previewCode` in the API response.

---

## v1.0.0 Launch Tasks — Detail

### Day 1: Bug Fixes (Critical)

| Issue | Task | Priority | Details |
|:-----:|------|:--------:|---------|
| [#30](https://github.com/farzad-bahadorifar/mehrchain/issues/30) | **OTP auto-fill** | 🔴 P0 (Done) | Frontend reads `previewCode` from register/resend response → auto-fills OTP field → shows message: *"Your verification code has been auto-filled. In the future, this code will be sent to your email."* |
| [#31](https://github.com/farzad-bahadorifar/mehrchain/issues/31) | **Account deletion fix** | 🔴 P0 (Done) | Only clear localStorage when backend returns 200. On error: show *"Account deletion failed. Please try again."* Don't clear in `finally` block. |
| [#32](https://github.com/farzad-bahadorifar/mehrchain/issues/32) | **English email template** | 🔴 P0 (Done) | Rewrite Farsi email template in `mail.service.ts` to English. Keep branded dark theme design. |

### Day 2: Profile Simplification
 
| Issue | Task / Action | Priority | Details |
|:-----:|---------------|:--------:|---------|
| [#33](https://github.com/farzad-bahadorifar/mehrchain/issues/33) | ❌ Remove Belly Glow Grid | 🟡 P1 (Done) | Remove color swatch grid (8+ swatches with streak-based locks) |
| [#33](https://github.com/farzad-bahadorifar/mehrchain/issues/33) | ❌ Remove Scroll-on-tap | 🟡 P1 (Done) | Remove scroll-to-bottom animation on mascot tap and "Tap to interact ✨" tooltip |
| [#33](https://github.com/farzad-bahadorifar/mehrchain/issues/33) | ✅ Keep Essential Profile | 🟡 P1 (Done) | Nickname editor + speech bubble, 21-Day Custom Glow unlock (only color reward), Dark/Light/System theme, Sign Out / Delete |

### Day 3: Journey + Duration + Spark

| Issue | Task | Priority | Details |
|:-----:|------|:--------:|---------|
| [#34](https://github.com/farzad-bahadorifar/mehrchain/issues/34) | **Journey simplify & Badges** | 🟡 P1 (Done) | Remove User Profile Card (duplicate). Keep Stats + Heatmap + Archived. Add badge data model with 5 initial badges (First Spark, Chain Starter, 7-Day Streak, 21-Day Master, Kind Soul) using Lucide icons. |
| [#35](https://github.com/farzad-bahadorifar/mehrchain/issues/35) | **Duration options** | 🟡 P1 (Done) | Replace 7d/14d/21d/30d/Custom with: **"Endless Journey"** (`totalDays = -1`) + **Custom** |
| [#36](https://github.com/farzad-bahadorifar/mehrchain/issues/36) | **Spark button** | 🟡 P1 (Done) | Rename "I did it" → "Spark" with Lucide `sparkles` icon + CSS scale/glow animation |

### Day 4: Loading UX

| Issue | Task | Priority | Details |
|:-----:|------|:--------:|---------|
| [#37](https://github.com/farzad-bahadorifar/mehrchain/issues/37) | **Skeleton loading** | 🟡 P1 (Done) | Add skeleton screens for Dashboard, Chain, Journey initial loads |
| [#37](https://github.com/farzad-bahadorifar/mehrchain/issues/37) | **Cold start message** | 🟡 P1 (Done) | After 5s wait: *"Waking up Mero... Free servers need a moment."* |
| [#37](https://github.com/farzad-bahadorifar/mehrchain/issues/37) | **Text shortening** | 🟡 P1 (Done) | Review all UI text. Make everything shorter and minimal. |

### Day 5: New Features

| Issue | Task | Priority | Details |
|:-----:|------|:--------:|---------|
| [#38](https://github.com/farzad-bahadorifar/mehrchain/issues/38) | **Articles placeholder** | 🟢 P2 (Backlog) | Add "Articles — Coming Soon" card in Chain page |
| [#39](https://github.com/farzad-bahadorifar/mehrchain/issues/39) | **What's New** | 🟢 P2 (Backlog) | Add changelog section in Profile + blue dot on Profile tab for new version |

### Day 6: Landing & Polish

| Issue | Task | Priority | Details |
|:-----:|------|:--------:|---------|
| [#40](https://github.com/farzad-bahadorifar/mehrchain/issues/40) | **Landing page** | 🟢 P2 (Backlog) | Complete redesign of `docs/index.html` (GitHub Pages), Mero hero section, philosophy, direct PWA/APK download links |
| [#40](https://github.com/farzad-bahadorifar/mehrchain/issues/40) | **Final text review** | 🟢 P2 (Backlog) | Ensure all text is English, short, minimal. No Farsi anywhere in the app. |

### Days 7-8: User Testing

| Task | Details |
|------|---------|
| **Recruit testers** | 3-5 people (friends/family) |
| **Test full flow** | Register → Verify OTP → Create habit → Spark → Chain invite → Accept → Heart |
| **Collect feedback** | "Is the app understandable? Anything confusing?" |
| **Fix blockers** | Address any blocking issues found |

### Day 9: Launch

| Task | Details |
|------|---------|
| **Tag v1.0.0** | Create release tag |
| **Deployment audit** | Verify frontend, backend, database all stable |
| **Public release** | Announce via landing page |

---

## Post-Launch Roadmap

### v1.1.0 — UX Polish & Micro-Interactions (Target: Late Oct 2026)

| Task | Details |
|------|---------|
| Three.js Spark Button | WebGL particle burst on habit completion. Lazy-loaded chunk (<1MB). (Ref: #20) |
| Real Articles | Chain page articles about kindness, habit chaining, human connection (CMS/Markdown) |
| Badge illustrations | Custom Mero-based badge designs (not emoji) |
| Design system docs | Document tokens, components, theme guide |
| E2E tests | Supertest: register → verify → habit → chain flow |
| PWA `SwUpdate` | Automatic "New version available" notifications |

### v1.2.0 — Accessibility & i18n (Target: Nov 2026)

| Task | Details |
|------|---------|
| ARIA labels | All interactive elements, modals, forms |
| Keyboard navigation | Full tab flow through all pages |
| Motion preferences | `prefers-reduced-motion` media query |
| Color contrast | WCAG AA compliance |
| Multi-language | English + Farsi via Transloco |
| RTL layout | Farsi RTL support |
| RTL layout | Farsi RTL support |

### v1.3.0 — Real Email & Domain (Target: Dec 2026)

| Task | Details |
|------|---------|
| Custom domain | Purchase and configure |
| Resend verified domain | Real OTP email delivery |
| Remove `previewCode` | No more auto-fill fallback |
| Paid hosting | If user count > 200 |
| Google Play Store | App listing with signed APK |

### v2.0.0 — Beyond Habit Tracker (Target: Q1 2027)

> **The true vision: charity, mindful companion, self-growth, people connection**

| Task | Details |
|------|---------|
| WebSocket real-time | Live chain activity updates |
| Kindness challenges | Community goals and challenges |
| Mero illustrations | Custom animated mascot (replace emoji-based) |
| Charity integration | Link habits to real-world causes |
| Advanced analytics | Personal insights and growth patterns |

---

## Version Milestones

| Version | Date | Key Deliverable |
|---------|------|-----------------|
| **v0.9.0-preview** | Sep 2026 | Initial MVP with habit tracking |
| **v0.9.1** | Sep 22 | Chain backend API + frontend redesign |
| **v1.0.0-rc1** | Sep 27 | Security, SMTP, signed APK |
| **v1.0.0-rc2** | Sep 27 | Loading spinners & anti-spam |
| **v1.0.0-rc3** | Sep 28 | OTP fix, Resend config, invite URL fix |
| **v1.0.0** | Oct 8 | Official launch — bug fixes, UI simplification, badges, Spark |
| **v1.1.0** | Late Oct | Three.js Spark, articles, design system |
| **v1.2.0** | Nov | Accessibility + multi-language |
| **v1.3.0** | Dec | Real email, custom domain, Play Store |
| **v2.0.0** | Q1 2027 | Beyond habit tracker — charity, real-time, community |

---

## Test Suite Status

| Suite | Framework | Tests | Suites |
|-------|-----------|:-----:|:------:|
| Frontend | Vitest | 135 | 30 |
| Backend | Jest | 88 | 11 |
| **Total** | | **223** | **41** |

---

## Design Principles (Must Follow)

1. **Minimal** — no clutter, no pressure, no feature bloat
2. **No external emoji** — only Lucide icons or Mero-based designs
3. **English only** — all UI, emails, and user-facing text in English
4. **Short text** — concise, clear, measured words
5. **Support, not competition** — no leaderboards, no streak shaming
6. **Growth in the shadows** — not social media show-off
7. **Kindness first** — the "Mehr" in MehrChain means kindness
