# 🔥 MehrChain

**"You, light your own lamp." — Rumi**

MehrChain is an open-source, mindful growth companion designed to help people commit to positive habits, nurture mental well-being, and spark supportive human connections through small, daily intentional actions.

> 🚀 **Project Status:** v1.0.0 | Nx Monorepo | Angular 21 (Zoneless + Signals) & NestJS 11 | 233 Automated Tests (100% Green) | Cloudflare Pages + Render CI/CD

[![Build & Release Android APK](https://github.com/farzad-bahadorifar/mehrchain/actions/workflows/build-apk.yml/badge.svg)](https://github.com/farzad-bahadorifar/mehrchain/actions/workflows/build-apk.yml)
[![Version](https://img.shields.io/badge/version-v1.0.0-teal.svg)](https://github.com/farzad-bahadorifar/mehrchain/releases)
[![Tests](https://img.shields.io/badge/tests-233%20passed-brightgreen.svg)](https://github.com/farzad-bahadorifar/mehrchain/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

## 🌟 Our Philosophy

MehrChain bridges **mindful well-being** with **habit formation mechanics** and **quiet human connection**:

* **Be the Spark:** Inspired by Rumi's timeless wisdom, true transformation starts from within. Light your own lamp first before brightening the world.
* **Quiet Accountability:** No toxic leaderboards, punitive streak resets, or social media show-off feeds. Your chain partner sees your consistency and quietly cheers you on.
* **Endless Journey:** Real self-growth has no artificial deadline. Choose an "Endless Journey" or set your custom duration.
* **Mindful Companion:** **Mero** is your gentle 3D companion that celebrates every spark and waits patiently when you are away.
* **Kindness First:** The word *"Mehr"* means kindness and love in Persian. MehrChain is built on empathy, self-compassion, and giving back.

---

## 📸 Screenshots & Landing

<p align="center">
  <a href="https://farzad-bahadorifar.github.io/mehrchain/" target="_blank">
    <img width="600" alt="MehrChain Preview" src="docs/app-screenshot.png" />
  </a>
</p>

* 🌐 **Landing Page:** [farzad-bahadorifar.github.io/mehrchain](https://farzad-bahadorifar.github.io/mehrchain/)
* 📱 **Web App (PWA):** [mehrchain.pages.dev](https://mehrchain.pages.dev)
* 📦 **Android APK:** [GitHub Releases](https://github.com/farzad-bahadorifar/mehrchain/releases/latest)

---

## 🌟 Key Features

* **⚡ One-Tap Spark:** Energized habit completion with CSS glow pulse animation, instant local feedback, and chain auto-notification.
* **♾️ Endless Journey & Custom Durations:** Commit to lifetime habits (`totalDays = -1`) without artificial deadlines, or set custom duration targets.
* **🔗 The Silent Chain:** Link habits with friends via invite links or QR codes. Includes 5 intelligent states (*Completed, Waiting, Resting, Fading, Journey Complete*), mutual heart reactions, and gentle reminders.
* **🏆 Milestones & Badges:** Milestone achievement system featuring 5 initial badges (*First Spark, Chain Starter, 7-Day Streak, 21-Day Master, Kind Soul*) with clean Lucide icons.
* **🧘 Mero Companion & 21-Day Custom Glow:** Official 3D companion mascot with 7 reactive emotional states (*Idle, Content, Happy, Waiting, Celebrating, Sleepy, Missing*), custom nickname, and 21-day streak custom aura color unlock.
* **📱 Offline-First Engine:** Optimistic updates in `localStorage` with background synchronization to the NestJS API when network connectivity resumes.
* **🔐 Seamless Authentication:** 1-click Google OAuth / ID token login, stateless JWTs, and secure 6-digit email OTP verification.
* **🌐 Cloudflare API Proxy:** Built-in edge proxying (`/api/*`) on Cloudflare Pages Functions to guarantee fast global connectivity.
* **✨ What's New Changelog:** Built-in version release notes in Profile with update notifications and blue indicator dot.
* **📖 Mindful Reads:** Upcoming articles section in Chain focusing on kindness, mindful routines, and human connection.

---

## 🛠 Tech Stack

```
mehrchain/                               # Nx 22.5 Monorepo
├── apps/
│   ├── mehrchain-frontend/              # Angular 21 (Zoneless, Signals, Tailwind 4, Capacitor 8)
│   └── mehrchain-backend/               # NestJS 11 (Prisma, PostgreSQL, JWT, Passport, Swagger)
├── libs/
│   └── shared-data/                     # Shared TypeScript contracts & interfaces
└── .agents/skills/                      # Modular AI development skills & runbooks
```

### **Frontend**
* **Framework:** Angular 21 (Zoneless change detection, Signals, Control Flow `@if/@for`)
* **State Management:** NgRx Signal Store (`@ngrx/signals`) with Facade pattern
* **Styling:** Tailwind CSS 4 with HSL design tokens & system/dark/light themes
* **Icons:** Lucide Angular (Tree-shaken, 100% vector SVG)
* **Mobile & PWA:** Capacitor 8 + Ionic Angular (`mode: 'ios'`) + Angular Service Worker (`ngsw`)
* **Testing:** Vitest (143 unit & component tests across 31 suites)

### **Backend**
* **Framework:** NestJS 11 (Modular architecture, DTOs, global `ValidationPipe`)
* **Database & ORM:** PostgreSQL (Neon Serverless) with Prisma ORM
* **Authentication:** Google OAuth token verification, Passport JWT (30-day expiry), bcryptjs, Resend SMTP with OTP
* **Error Handling:** Global `AllExceptionsFilter` with normalized API error payloads
* **Documentation:** OpenAPI / Swagger (`/api/docs`)
* **Testing:** Jest (90 service & controller unit tests across 11 suites)

---

## 🗺️ Master Schedule & Releases

| Version | Focus | Deliverables | Status |
|:-------:|-------|--------------|:------:|
| **v0.9.0** | MVP Foundation | Single-player habit tracking, heatmap calendar, initial auth | ✅ Done |
| **v0.9.1** | Silent Chain Beta | Multi-user habit chains, invite links, 5 card states | ✅ Done |
| **v1.0.0** | Production Launch | Spark button, Endless Journey, 5 Badges, Custom Glow, Google Auth, What's New | ✅ Launch Ready |
| **v1.1.0** | UX Polish & Micro-Interactions | WebGL particle burst, markdown articles CMS, design system docs | ⏳ Planned |
| **v1.2.0** | Accessibility & i18n | WCAG AA compliance, ARIA labels, Transloco multi-language | ⏳ Planned |
| **v2.0.0** | Beyond Habit Tracker | Real-world charity integration, mindful challenges, real-time sync | 🔮 Vision |

---

## 📚 Technical Documentation

* 📐 **[Development Roadmap](docs/development_roadmap.md)** — Master schedule, sprint timeline, and completed tasks backlog.
* 🔗 **[Chain Feature Specification](docs/chain_feature_spec.md)** — Comprehensive architecture, state machine, and data models for Chain.
* 📐 **[Architecture Analysis](docs/architecture_analysis.md)** — High-level diagrams, service graph, and database ERD.
* 🏆 **[Technical Audit Scorecard](docs/technical_scorecard.md)** — Multi-dimension code audit and quality assessment.
* 🎨 **[UI/UX Evaluation](docs/ux_evaluation.md)** — Heuristic review, design principles, and Mero mascot rules.
* 🤖 **[AI Context & Rules](GEMINI.md)** — Monorepo rules and GitHub task lifecycle protocols.

---

## 🚀 Quick Start

### Prerequisites
* **Node.js:** 22 LTS or higher
* **npm:** 10.x or higher
* **Database:** PostgreSQL (local instance or free [Neon](https://neon.tech/) cloud database)

### 1. Clone & Install
```bash
git clone https://github.com/farzad-bahadorifar/mehrchain.git
cd mehrchain
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env` and configure your variables:
```env
DATABASE_URL="postgresql://user:password@host:5432/mehrchain?schema=public"
JWT_SECRET="your-development-jwt-secret"
PORT=3000
```

### 3. Initialize Database
```bash
npx prisma generate --schema=apps/mehrchain-backend/prisma/schema.prisma
npx prisma migrate dev --schema=apps/mehrchain-backend/prisma/schema.prisma
```

### 4. Run Development Servers
Start frontend and backend concurrently with live reload:
```bash
npm run dev
```
* 🌐 **Frontend:** `http://localhost:4300`
* 🔌 **Backend API:** `http://localhost:3000/api`
* 📖 **Swagger Docs:** `http://localhost:3000/api/docs`

### 5. Run Automated Tests
```bash
# Run all 233 tests across frontend and backend
npx nx run-many -t test

# Run frontend tests (Vitest — 143 tests)
npx nx test mehrchain-frontend

# Run backend tests (Jest — 90 tests)
npx nx test mehrchain-backend
```

### 6. Build Mobile / Android
```bash
# Build web assets and sync to native Capacitor project
npm run mobile:build

# Open in Android Studio
npx cap open android
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

<p align="center">
  <i>Made with ❤️ and mindfulness for a kinder, more connected world.</i>
</p>
