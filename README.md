# 🔥 MehrChain

**Light your own lamp. Brighten the world.**

تو مگو همه بِجَنگند و زِ صُلح من چه آید؟ تو یکی نه‌‌ای هزاری تو چراغِ خود بَراَفْروز

که یکی چراغِ روشن زِ هزار مُرده بهتر که بِهْ است یک قَدِ خوش زِ هزارْ قامَتِ کوز

MehrChain is an open-source, mindful growth companion designed to help people commit to positive habits, nurture mental well-being, and spark supportive human connections through small, daily intentional actions.

- 🌐 **Landing Page:** [farzad-bahadorifar.github.io/mehrchain](https://farzad-bahadorifar.github.io/mehrchain/ "null")
    
- 📱 **Web App (PWA):** [mehrchain.pages.dev](https://mehrchain.pages.dev/ "null")
    
- 📦 **Android APK:** [GitHub Releases](https://github.com/farzad-bahadorifar/mehrchain/releases/latest "null")
    

> **Development status:** See the [active roadmap](https://gemini.google.com/app/docs/development_roadmap.md "null"), [task evidence](https://gemini.google.com/app/docs/roadmap/completed.md "null"), and source version metadata. Local checks, deployment, and real-device acceptance are tracked separately.

[Version metadata](https://gemini.google.com/app/app-version.json "null")  

## 🤝 Seeking Co-Founder, Contributors & Infrastructure Partners

MehrChain is built with love from Iran through an AI-augmented engineering workflow. While the full-stack architecture, PWA, Android build, and structured V2 engineering roadmap (`T29`–`T53`) are actively progressing, international payment restrictions currently block access to paid global infrastructure (such as custom domains, production Resend SMTP configuration in `D-002`, and dedicated cloud hosting).

We are actively looking for:

1. **A Global Co-Founder / Operations Partner (Based Outside Iran):** Someone who deeply resonates with mindful technology and mental well-being to co-own global operations, infrastructure provisioning, community growth, and future charity integrations.
    
2. **Infrastructure Sponsors:** Support with domain registration, transactional email (Resend), or cloud credits to help transition MehrChain from free-tier hosting (`github.io` & `pages.dev`) to a full global launch.
    
3. **Open-Source Contributors:** Frontend (Angular 21), Backend (NestJS 11), and UI/UX contributors to pick up scoped, atomic tasks from our [active roadmap](https://gemini.google.com/app/docs/development_roadmap.md "null") (`T29`–`T53`).
    

💬 **Interested in partnering or helping out?** Reach out via [GitHub Issues](https://github.com/farzad-bahadorifar/mehrchain/issues "null") or connect with the founder on X/Threads.

## 🌟 Our Philosophy

MehrChain bridges **mindful well-being** with **habit formation mechanics** and **quiet human connection**:

- **Be the Spark:** Inspired by Rumi's timeless wisdom, true transformation starts from within. Light your own lamp first before brightening the world.
    
- **Quiet Accountability:** No toxic leaderboards, punitive streak resets, or social media show-off feeds. Your chain partner sees your consistency and quietly cheers you on.
    
- **Completion-First Support:** Show up for yourself first—complete your own daily commitment to unlock sending supportive hearts to your chain (`D-008`).
    
- **Mindful Journeys & Memories:** Choose between finite shared experiences or an "Endless Journey" where every attempt is honored as a lasting memory (`D-009`).
    
- **Mindful Companion:** **Mero** is your gentle companion that celebrates every spark, waits patiently when you are away, and unlocks custom aura colors after 21 consecutive days (`D-001`).
    
- **Kindness First:** The word _"Mehr"_ means kindness and love in Persian. MehrChain is built on empathy, self-compassion, and giving back.
    

## Before Contributing

Read [the active roadmap](https://gemini.google.com/app/docs/development_roadmap.md "null"), [decision memory](https://gemini.google.com/app/docs/roadmap/context.md "null"), and [CONTRIBUTING.md](https://gemini.google.com/app/CONTRIBUTING.md "null") before development. Use English for all project-authored development material, issue/PR text, and UI copy; keep the original Persian poem at the top of this file unchanged.

## 🌟 Key Capabilities

- **⚡ One-Tap Spark:** Energized habit completion with glow pulse animation, instant local feedback, and chain notifications.
    
- **♾️ Endless Commitments & Finite Experiences:** Commit to lifetime habits (`totalDays = -1`) or structured experiences, with dedicated solo and shared memory archives.
    
- **🔗 The Silent Chain:** Link habits with friends via invite links or QR codes featuring intelligent states (_Completed, Waiting, Resting, Fading, Journey Complete_), mutual heart reactions, and anti-spam gentle nudges.
    
- **🏆 V2 Profile, Badges & Custom Glow:** Scoped V2 interface tokens (`T26`–`T28`) with dedicated Account, Badges, Colors, and Appearance routes, plus a 21-day streak custom aura color unlock.
    
- **📱 Offline-First Engine:** Optimistic updates in `localStorage` with background synchronization to the NestJS API when network connectivity resumes.
    
- **🔐 Seamless Authentication:** 1-click Google OAuth / ID token login, stateless JWTs, and 6-digit email OTP verification.
    
- **🌐 Cloudflare API Proxy:** Built-in edge proxying (`/api/*`) on Cloudflare Pages Functions.
    

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

- **Framework:** Angular 21 (Zoneless change detection, Signals, Control Flow `@if/@for`)
    
- **State Management:** NgRx Signal Store (`@ngrx/signals`) with Facade pattern
    
- **Styling:** Tailwind CSS 4 with V2 HSL design tokens & system/dark/light themes
    
- **Icons:** Lucide Angular (Tree-shaken, 100% vector SVG)
    
- **Mobile & PWA:** Capacitor 8 + Ionic Angular (`mode: 'ios'`) + Angular Service Worker (`ngsw`)
    
- **Testing:** Vitest for frontend unit and component checks.
    

### **Backend**

- **Framework:** NestJS 11 (Modular architecture, DTOs, global `ValidationPipe`)
    
- **Database & ORM:** PostgreSQL (Neon Serverless) with Prisma ORM
    
- **Authentication:** Google OAuth token verification, Passport JWT (30-day expiry), bcryptjs, Resend SMTP with OTP
    
- **Error Handling:** Global `AllExceptionsFilter` with normalized API error payloads
    
- **Documentation:** OpenAPI / Swagger (`/api/docs`)
    
- **Testing:** Jest for backend checks.
    

## 🗺️ Roadmap & Active Workstreams

Instead of vague milestones, MehrChain tracks every change as an atomic, verifiable task card in the [**Active Roadmap**](https://gemini.google.com/app/docs/development_roadmap.md "null").

|   |   |   |
|---|---|---|
|**Workstream**|**Active Cards**|**Focus & Status**|
|**V2 Profile & Tokens**|`T20`–`T28`|V2 design tokens, Profile routes (Account, Badges, Colors, Appearance), username handling (**Done Locally**)|
|**Completion-Only Support & Chain Views**|`T33`, `T34`|Auditing heart eligibility rules (`D-008`) and separate Connect / Show Up views (**Ready**)|
|**Experiences, Attempts & Pair Outcomes**|`T35`, `T36`, `T37`|Finite experiences vs. Endless commitments, 3-day archive rules, joint outcomes (**Ready**)|
|**Journey Memories**|`T38`, `T39`, `T40`|Solo and shared memory archives across ongoing, successful, and unfinished attempts (**Ready**)|
|**Notifications & Private Why**|`T41`–`T44`|Platform delivery inventory, voluntary private "Why", absence reminders, anti-spam partner nudges (**Ready**)|
|**UI Refinements & Diagnostics**|`T29`–`T31`, `T45`–`T53`|Live route diagnostics, PWA phone verification, responsive frame audits, invite continuation (**Active Queue**)|

## 📚 Technical Documentation

- 📐 [**Development Roadmap**](https://gemini.google.com/app/docs/development_roadmap.md "null") — Current task registry (`T29`–`T53`), review gates, release dependencies, and linked historical evidence.
    
- 🧭 [**Decisions & Known Constraints**](https://gemini.google.com/app/docs/roadmap/context.md "null") — Dated reasons (`D-001` to `D-011`), known blockers, work not to repeat, and explicit reopening conditions.
    
- 🔭 [**Product Direction**](https://gemini.google.com/app/docs/roadmap/direction.md "null") — Why the product evolved this way, near-term outcomes, and future unknowns.
    
- ✅ [**Completed Ledger**](https://gemini.google.com/app/docs/roadmap/completed.md "null") — Exact completed outcomes and verification evidence outside the active queue.
    
- 🎨 [**Wireframe Delivery Contract**](https://gemini.google.com/app/docs/ui_ux_discovery_plan.md "null") — Clickable previews and design system rules.
    
- 🔗 [**Chain Feature Specification**](https://gemini.google.com/app/docs/chain_feature_spec.md "null") — Architecture, state machine, and data models for Chain.
    
- 🤖 [**AI Context & Rules**](https://gemini.google.com/app/GEMINI.md "null") — Monorepo rules and task lifecycle protocols.
    

## 🚀 Quick Start

### Prerequisites

- **Node.js:** 22 LTS or higher
    
- **npm:** 10.x or higher
    
- **Database:** PostgreSQL (local instance or free [Neon](https://neon.tech/ "null") cloud database)
    

### 1. Clone & Install

```
git clone https://github.com/farzad-bahadorifar/mehrchain.git
cd mehrchain
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and configure your variables:

```
DATABASE_URL="postgresql://user:password@host:5432/mehrchain?schema=public"
JWT_SECRET="your-development-jwt-secret"
PORT=3000
```

### 3. Initialize Database

```
npx prisma generate --schema=apps/mehrchain-backend/prisma/schema.prisma
npx prisma migrate dev --schema=apps/mehrchain-backend/prisma/schema.prisma
```

### 4. Run Development Servers

```
npm run dev
```

- 🌐 **Frontend:** `http://localhost:4300`
    
- 🔌 **Backend API:** `http://localhost:3000/api`
    
- 📖 **Swagger Docs:** `http://localhost:3000/api/docs`
    

Press `Ctrl+C` to stop both services before building on Windows: a running backend locks Prisma's `query_engine-windows.dll.node`, causing `prisma generate` to fail with `EPERM` when replacing it.

### 5. Build & Test

```
# Run frontend (Vitest) and backend (Jest) tests
npx nx run-many -t test

# Build production outputs
npm run build
```

### 6. Build Mobile / Android

```
npm run mobile:build
npx cap open android
```

## 📄 License

This project is licensed under the [MIT License](https://gemini.google.com/app/LICENSE "null").
