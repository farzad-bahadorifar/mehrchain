# MehrChain — Development Roadmap

> From v0.9.0-preview to production-ready v1.0 and beyond.
> Updated: 2026-09-30 (8 Mehr 1405)
> Target Audience: English-speaking users

---

## 📅 Master Schedule & Timeline

### v1.0.0 Launch Sprint (8 Mehr – 16 Mehr / Oct 1–8)

| Day | Date | Focus | Tasks | Status |
|-----|------|-------|-------|:------:|
| 1 | 8 Mehr (Oct 1) | 🔴 Bug Fixes | OTP `previewCode` auto-fill • Account deletion fix • English email template | ⏳ TODO |
| 2 | 9 Mehr (Oct 2) | 🟡 Profile Simplify | Remove color swatch grid • Remove scroll-on-tap • Keep nickname + 21-day only | ⏳ TODO |
| 3 | 10 Mehr (Oct 3) | 🟡 Journey + Spark | Remove user card • "Endless Journey" + Custom duration • "I did it" → "Spark" + CSS animation | ⏳ TODO |
| 4 | 11 Mehr (Oct 4) | 🟡 Loading UX | Skeleton loading • Cold start message • Shorten all UI text | ⏳ TODO |
| 5 | 12 Mehr (Oct 5) | 🟢 New Features | Articles "Coming Soon" • What's New section • Badge system foundations | ⏳ TODO |
| 6 | 13 Mehr (Oct 6) | 🟢 Landing + Polish | Landing page CTA • Direct PWA/APK links • Final text review | ⏳ TODO |
| 7-8 | 14–15 Mehr (Oct 7-8) | 🧪 User Testing | 3-5 testers • Full flow: register → verify → habit → chain → spark | ⏳ TODO |
| 9 | 16 Mehr (Oct 8) | 📦 Launch | Tag v1.0.0 • Final deployment audit • Public release | ⏳ Planned |

### Completed Tasks (Pre-Launch)

| Issue | Task Title | Phase | Status | Date | Notes |
|:-----:|------------|-------|:------:|:----:|-------|
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
| [#22](https://github.com/farzad-bahadorifar/mehrchain/issues/22) | Refactor & Split OnboardingComponent | Phase 2 (Refactor) | ✅ Done | Sep 27 | Step components + auth modals |
| [#13](https://github.com/farzad-bahadorifar/mehrchain/issues/13) | Remove Mero Personality section | Phase 2 (Cleanup) | ✅ Done | Sep 24 | Profile cleanup & tests verified |
| [#14](https://github.com/farzad-bahadorifar/mehrchain/issues/14) | Remove console.log debug calls | Phase 2 (Cleanup) | ✅ Done | Sep 24 | Codebase cleanup |
| [#24](https://github.com/farzad-bahadorifar/mehrchain/issues/24) | Setup SMTP (Resend) | Phase 3 (Stability) | ✅ Done | Sep 27 | Free tier: 3K emails/month |
| [#23](https://github.com/farzad-bahadorifar/mehrchain/issues/23) | Add backend tests to CI pipeline | Phase 3 (Stability) | ✅ Done | Sep 27 | GitHub Actions backend test step |
| [#25](https://github.com/farzad-bahadorifar/mehrchain/issues/25) | Signed Release APK (GitHub Actions) | Phase 3 (Mobile) | ✅ Done | Sep 27 | Keystore signing CI workflow |

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

| Task | Details |
|------|---------|
| **OTP auto-fill** | Frontend reads `previewCode` from register/resend response → auto-fills OTP field → shows message: *"Your verification code has been auto-filled. In the future, this code will be sent to your email."* |
| **Account deletion fix** | Only clear localStorage when backend returns 200. On error: show *"Account deletion failed. Please try again."* Don't clear in `finally` block. |
| **English email template** | Rewrite Farsi email template in `mail.service.ts` to English. Keep branded dark theme design. |

### Day 2: Profile Simplification

| Action | What |
|--------|------|
| ❌ Remove | Belly Glow Color grid (8+ color swatches with streak-based locks) |
| ❌ Remove | Scroll-to-bottom animation on mascot tap |
| ❌ Remove | "Tap to interact ✨" tooltip (emoji not allowed) |
| ✅ Keep | Nickname editor + speech bubble |
| ✅ Keep | 21-Day Custom Glow unlock (only color reward) |
| ✅ Keep | Dark/Light/System theme selector |
| ✅ Keep | Account settings (Sign Out / Delete) |

### Day 3: Journey + Duration + Spark

| Task | Details |
|------|---------|
| **Journey simplify** | Remove User Profile Card (duplicate). Keep Stats + Heatmap + Archived. |
| **Duration options** | Replace 7d/14d/21d/30d/Custom with: **"Endless Journey"** (`totalDays = -1`) + **Custom** |
| **Spark button** | Rename "I did it" → "Spark" with Lucide `sparkles` icon + CSS scale/glow animation |
| **Badge foundations** | Add badge data model. 5 initial badges: First Spark, Chain Starter, 7-Day Streak, 21-Day Master, Kind Soul. All use Lucide icons (no external emoji). |

### Day 4: Loading UX

| Task | Details |
|------|---------|
| **Skeleton loading** | Add skeleton screens for Dashboard, Chain, Journey initial loads |
| **Cold start message** | After 5s wait: *"Waking up Mero... Free servers need a moment."* |
| **Text shortening** | Review all UI text. Make everything shorter and minimal. |

### Day 5: New Features

| Task | Details |
|------|---------|
| **Articles placeholder** | Add "Articles — Coming Soon" card in Chain page |
| **What's New** | Add changelog section in Profile + blue dot on Profile tab for new version |

### Day 6: Landing & Polish

| Task | Details |
|------|---------|
| **Landing page** | Improve CTA, add direct links to PWA and APK download |
| **Final text review** | Ensure all text is English, short, minimal. No Farsi anywhere in the app. |

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
| Three.js Spark Button | WebGL particle burst on habit completion. Lazy-loaded chunk (<1MB). |
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
| Frontend | Vitest | 105 | 24 |
| Backend | Jest | 80 | 10 |
| **Total** | | **185** | **34** |

---

## Design Principles (Must Follow)

1. **Minimal** — no clutter, no pressure, no feature bloat
2. **No external emoji** — only Lucide icons or Mero-based designs
3. **English only** — all UI, emails, and user-facing text in English
4. **Short text** — concise, clear, measured words
5. **Support, not competition** — no leaderboards, no streak shaming
6. **Growth in the shadows** — not social media show-off
7. **Kindness first** — the "Mehr" in MehrChain means kindness
