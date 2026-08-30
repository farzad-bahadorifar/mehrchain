# 🔥 MehrChain

**"You, light your own lamp." — Rumi**

MehrChain is a mindful habit companion designed to help you commit to positive goals, track your consistency, and spark positive chain reactions through small, daily actions.

> 🚀 **Project Status:** v0.9.0-preview | Nx Monorepo | Angular 21 & NestJS 11 | 60 Automated Tests (100% Green) | Cloud CI/CD APK

[![Build & Release Android APK](https://github.com/farzad-bahadorifar/mehrchain/actions/workflows/build-apk.yml/badge.svg)](https://github.com/farzad-bahadorifar/mehrchain/actions/workflows/build-apk.yml)
[![Version](https://img.shields.io/badge/version-v0.9.0--preview-teal.svg)](https://github.com/farzad-bahadorifar/mehrchain/releases)
[![Tests](https://img.shields.io/badge/tests-60%20passed-brightgreen.svg)]()

---

## 🌟 Our Philosophy

* **Be the Spark:** Inspired by ancient Persian wisdom and Rumi's poetry, positive change begins from within. Light your own lamp first.
* **Chain Effects (Coming Soon):** Every small act—reading, walking, sharing, or pausing—triggers positive ripple effects. Daily sparks interconnect into unbreakable life chains.
* **Consistency over Pressure:** No toxic leaderboards or punishing streaks. Mero is your gentle companion that celebrates every intentional step.

---

## 📸 Screenshots

<img width="384" height="837" alt="image" src="https://github.com/user-attachments/assets/de96cda6-1b47-45c7-b609-3fac88a4e6ae" />

---

## 🗺️ The Vision

MehrChain is evolving from a simple habit tracker into a **DeSoc (Decentralized Social) Ecosystem** for social good.

1.  **Phase 1: The Inner Spark (Current Focus)**
    * A seamless, single-player experience.
    * **Guest-First:** No login walls. Start your journey immediately.
    * **Mero:** Our mascot that reacts to your consistency.
    * **PWA:** Installable on any device, independent of app stores.

2.  **Phase 2: The Social Nudge**
    * Share your "Journey" publicly.
    * Friends can "nudge" (encourage) your goals without toxic competition.

3.  **Phase 3: The Economy of Good**
    * A "Proof-of-Support" mechanism where the community creates value.
    * Patronage system for funding real-world positive impacts using Crypto.

---

## 🌟 Key Features

* **Guest-First & Offline-First:** Instant onboarding without forced login walls. All habits, streaks, and progress function seamlessly offline with full data persistence.
* **Monthly Grid Heatmap Calendar:** Interactive and visual habit tracker supporting both Persian & Gregorian consistency, with full Dark Mode and Light Mode support.
* **Smart Habit Management:** Standard 7, 14, and 21-day milestones with custom target days, real-time edit modal, soft-delete confirmation, and an **Archived Flames** management with 1-click restore.
* **Mero Mascot:** An encouraging companion that celebrates your positive streaks and supports you when habits need rekindling.
* **Enterprise Error Handling:** Global NestJS exception filter (`AllExceptionsFilter`) and Angular HTTP interceptor (`errorInterceptor`) with friendly multilingual error normalization.
* **Cloud CI/CD & Automated APK:** GitHub Actions pipeline compiling production Android APKs on every semantic tag release.

---

## 🛠 Tech Stack

Built on an enterprise-grade, bleeding-edge architecture for performance, scalability, and type safety:

### **Frontend (The Face)**
* **Framework:** Angular 21 (Zoneless, Signals & Control Flow)
* **Styling:** Tailwind CSS 4 & Custom Mindful Design System
* **Icons:** Lucide Angular
* **Mobile Runtime:** Capacitor 8 (Cross-platform Android / iOS / PWA)
* **Unit Testing:** Vitest (38 Unit & Component Tests)

### **Backend (The Engine)**
* **Framework:** NestJS 11 (Clean Layered Architecture, DTOs & ValidationPipe)
* **Database & ORM:** Serverless PostgreSQL (Neon) with Prisma ORM
* **Security:** Passport JWT authentication with bcrypt password hashing
* **Documentation:** Interactive OpenAPI / Swagger (`/api/docs`)
* **Unit Testing:** Jest (22 Service & Controller Unit Tests)

### **Workspace & Quality Assurance**
* **Monorepo:** Nx (Unified CLI for frontend, backend, and shared libraries)
* **Total Automated Tests:** **60 Automated Unit & Component Tests (100% Passing)**

---

## 📱 Download & Try

* **Android APK (Direct Download):** Download the latest release from the [GitHub Releases](https://github.com/farzad-bahadorifar/mehrchain/releases/latest) page or from our [Landing Page](https://farzad-bahadorifar.github.io/mehrchain/).
* **Web Version:** Launch directly from the landing page.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env` and provide your PostgreSQL connection string:
```env
DATABASE_URL="your-postgresql-url"
JWT_SECRET="your-jwt-secret"
PORT=3000
```

### 3. Run Development Servers (Concurrent)
Run both frontend and backend simultaneously using Nx:
```bash
npm run dev
```
* Frontend: `http://localhost:4200`
* Backend API: `http://localhost:3000/api`
* Swagger API Docs: `http://localhost:3000/api/docs`

### 4. Run Automated Tests
```bash
# Run backend tests (22 unit tests with Jest)
npx nx test mehrchain-backend

# Run frontend tests (38 unit tests with Vitest)
npx nx test mehrchain-frontend
```

### 5. Build for Mobile
```bash
npm run mobile:build
```

---

*Made with ❤️ by the MehrChain Community.*