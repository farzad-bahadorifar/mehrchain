# 🔥 MehrChain

**"You, light your own lamp." — Rumi**

MehrChain is an open-source, mindful habit companion designed to help people commit to positive habits, nurture mental well-being, and spark social support networks through small, daily intentional actions.

> 🚀 **Project Status:** v0.9.0-preview | Nx Monorepo | Angular 21 (Zoneless + Signals) & NestJS 11 | 115 Automated Tests (100% Green) | Cloud CI/CD APK

[![Build & Release Android APK](https://github.com/farzad-bahadorifar/mehrchain/actions/workflows/build-apk.yml/badge.svg)](https://github.com/farzad-bahadorifar/mehrchain/actions/workflows/build-apk.yml)
[![Version](https://img.shields.io/badge/version-v0.9.0--preview-teal.svg)](https://github.com/farzad-bahadorifar/mehrchain/releases)
[![Tests](https://img.shields.io/badge/tests-115%20passed-brightgreen.svg)](https://github.com/farzad-bahadorifar/mehrchain/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

## 🌟 Our Philosophy

MehrChain bridges **mindful well-being** with **habit formation mechanics** and **positive social connections**:

* **Be the Spark:** Inspired by Rumi's timeless wisdom, true transformation starts from within. Light your own lamp first before brightening the world.
* **Positive Chain Reactions:** Every small act—breathing, reading, hydrating, smiling, or meditating—triggers positive ripple effects. Linking journeys with friends creates an unbreakable chain of kindness.
* **Support Over Pressure:** No toxic leaderboards, punitive streak resets, or anxiety-inducing mechanics. **Mero** is your gentle companion that celebrates every intentional step.
* **Mindful Companion:** Built from the ground up to feel calming, uplifting, and supportive—focusing on steady personal growth, self-compassion, and emotional well-being.

---

## 📸 Screenshots

<p align="center">
  <img width="360" alt="MehrChain Dashboard" src="https://github.com/user-attachments/assets/de96cda6-1b47-45c7-b609-3fac88a4e6ae" />
</p>

---

## 🗺️ Product Roadmap & Vision

```mermaid
graph LR
    P1["Phase 1: Inner Spark (Current)<br/>• Mindful Habits & Streaks<br/>• Mero Mascot Customization<br/>• Offline Resilience & PWA<br/>• Heatmap History"] 
    --> P2["Phase 2: Social Chain Network<br/>• Multi-User Habit Chains<br/>• Real-Time 'Ring the Bell'<br/>• Live Cheers & Nudges<br/>• In-App Partner Discovery"]
    --> P3["Phase 3: The Economy of Good<br/>• Community Support Circles<br/>• Proof-of-Dedication<br/>• Real-World Impact Initiatives"]
```

1. **Phase 1: The Inner Spark (Current Focus)**
   * Complete single-player mindful habit tracking across 4 pillars: *Health, Growth, Community, Environment*.
   * **Mero Mascot:** 7+ unlockable glow themes based on streaks and 3 distinct personalities (*Energetic ⚡, Calm 🧘, Focused 🎯*).
   * **Offline Resilience:** Optimistic local-first updates with background sync and PWA caching.
   * **Visual Consistency:** Monthly GitHub-style grid heatmap calendar.

2. **Phase 2: The Social Chain Network (Active Development)**
   * Two-way habit chains linking friends' journeys.
   * "Ring the Bell" celebration broadcasts to supporters.
   * Instant reactions (*Heart 💙, Cheer 🌟, Gentle Nudge 🔔*).

3. **Phase 3: The Economy of Good**
   * Community circles and collective mindfulness goals.
   * Proof-of-Support mechanisms for real-world charitable impacts.

---

## 🌟 Key Features

* **⚡ Offline-Resilient & Local-First:** Optimistic updates in `localStorage` with seamless background synchronization to the NestJS API when connected.
* **🧘 Mero Mascot & Customization Studio:** An expressive companion with 7 streak-unlocked aura themes (Golden, Ocean, Nebula, Emerald, Sakura, Aurora, Cosmic Fire) plus a custom color studio at 21-day streaks.
* **📅 Monthly Grid Heatmap Calendar:** Interactive visual tracking supporting Persian & Gregorian timelines with dark and light theme adaptation.
* **🔗 Chain Network (Duo Habits):** Shareable invite links, QR code generation, and supportive non-competitive reactions.
* **🛡️ Secure OTP Authentication:** Password hashing via bcrypt, 6-digit email verification with DNS MX validation and disposable email filters, stateless JWT tokens.
* **🔔 Native Local Notifications:** Scheduled daily habit reminders powered by Capacitor without third-party push server dependencies.
* **📱 Cross-Platform PWA & Mobile:** Installable PWA with Angular NGSW service worker, iOS ready, and automated Android APK builds via GitHub Actions.

---

## 🛠 Tech Stack

```
mehrchain/                               # Nx 22.5 Monorepo
├── apps/
│   ├── mehrchain-frontend/              # Angular 21 (Zoneless, Signals, Tailwind 4, Capacitor 8)
│   └── mehrchain-backend/               # NestJS 11 (Prisma, PostgreSQL, JWT, Swagger)
├── libs/
│   └── shared-data/                     # Shared TypeScript contracts & interfaces
└── .agents/skills/                      # AI development skills & runbooks
```

### **Frontend**
* **Framework:** Angular 21 (Zoneless change detection, Signals, Control Flow `@if/@for`)
* **State Management:** NgRx Signal Store (`@ngrx/signals`) with Facade pattern
* **Styling:** Tailwind CSS 4 with HSL design tokens & class-based Dark Mode
* **UI Primitives:** CVA (Class Variance Authority) components (`McButton`, `McBadge`, `McCard`)
* **Icons:** Lucide Angular (Tree-shaken)
* **Mobile & PWA:** Capacitor 8 + Ionic Angular (`mode: 'ios'`) + Angular Service Worker
* **Testing:** Vitest (38 unit & component tests)

### **Backend**
* **Framework:** NestJS 11 (Modular architecture, DTOs, global `ValidationPipe`)
* **Database & ORM:** PostgreSQL (Neon Serverless) with Prisma ORM
* **Authentication:** Passport JWT (30-day expiry) + bcryptjs + OTP verification
* **Error Handling:** Global `AllExceptionsFilter` with normalized error payloads
* **Documentation:** OpenAPI / Swagger (`/api/docs`)
* **Testing:** Jest (22 service & controller unit tests)

---

## 📚 Technical Documentation & Architecture

We maintain in-depth technical reports and audits in the repository:

* 📐 **[Architecture Analysis & Dependency Map](docs/architecture_analysis.md)** — High-level diagrams, service graph, database ERD, and deployment topology.
* 🏆 **[Technical Audit Scorecard](docs/technical_scorecard.md)** — 8-dimension code audit (B grade overall) with technical debt inventory.
* 🎨 **[UI/UX Heuristic Evaluation](docs/ux_evaluation.md)** — Nielsen's 10 heuristics assessment, competitive benchmark, and Mero mascot design review.
* 🤝 **[Contributing Guide](CONTRIBUTING.md)** — Step-by-step contribution runbook, code conventions, and high-priority tasks.
* 🤖 **[AI Context & Rules](GEMINI.md)** — Project rules and modular AI development skills (`.agents/skills/`).

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
Copy `.env.example` to `.env` and set your credentials:
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
# Run all tests across the monorepo (115 tests)
npx nx run-many -t test

# Run frontend tests (Vitest)
npx nx test mehrchain-frontend

# Run backend tests (Jest)
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

## 📱 Download & Releases

* **Android APK:** Download the latest debug APK from [GitHub Releases](https://github.com/farzad-bahadorifar/mehrchain/releases/latest).
* **Web App (PWA):** Hosted globally on [Cloudflare Pages](https://mehrchain.pages.dev).
* **Backend API:** Hosted on [Render](https://mehrchain-api.onrender.com) with Serverless PostgreSQL on [Neon.tech](https://neon.tech).

---

## 🤝 Contributing

MehrChain is open-source and welcomes contributions from developers, designers, and mindfulness enthusiasts!

Please read our **[CONTRIBUTING.md](CONTRIBUTING.md)** for:
- Code standards (TypeScript strict mode, Angular 21 conventions)
- Commit message formatting (Conventional Commits)
- High-priority roadmap tasks (ChainModule API, Onboarding refactor, i18n, a11y)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">
  <i>Made with ❤️ and mindfulness for a kinder, more connected world.</i>
</p>
