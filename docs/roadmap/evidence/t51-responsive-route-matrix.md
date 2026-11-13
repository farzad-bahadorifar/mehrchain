# T51 Evidence Report: Responsive Route Matrix & Viewport Audit

Date: 2026-11-13, Asia/Tehran.
Scope: Systematic responsive audit across all core application routes, viewports, safe-area bounds, and input states.

---

## 1. Audit Parameters & Environment

- **Build / Branch**: `feature/roadmap-autonomous-execution` (Angular 21 zoneless, Capacitor 8).
- **Core Container Boundary**:
  - `styles.css`: `--app-shell-width: 34rem` (~544px maximum container width, centered horizontally on wide viewports).
  - Minimum height: `100dvh` / dynamic viewport height handling.
  - Safe-area insets: `env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`, `env(safe-area-inset-left)`, `env(safe-area-inset-right)`.
- **Target Viewports Tested**:
  1. **320px × 568px** (Compact mobile: iPhone SE 1st gen / small Android)
  2. **390px × 844px** (Standard modern mobile: iPhone 13/14/15, Pixel 7)
  3. **768px × 1024px** (Tablet portrait: iPad Mini / Android tablet)
  4. **1280px × 800px** (Compact desktop / laptop browser)
- **Theme Modes**: Evaluated in both Light and Dark themes.

---

## 2. Route by Viewport Audit Matrix

| Route / Component | State / Scenario | 320px | 390px | 768px | Desktop | Status | Observations / Task Reference |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Welcome / Onboarding** (`/`) | Cold start, 1st slide | PASS | PASS | PASS | PASS | Pass | Fluid flex column; Mero asset scales cleanly; zero horizontal overflow. |
| **Welcome / Onboarding** (`/`) | 200% text zoom | PASS | PASS | PASS | PASS | Pass | Text wraps cleanly; CTA remains reachable via vertical scroll. |
| **Session Restore** (`/`) | Restoring session spinner | PASS | PASS | PASS | PASS | Pass | Center-aligned; safe-area padded. |
| **Login / OTP Entry** (`/`) | Virtual keyboard open | PASS | PASS | PASS | PASS | Pass | Inputs remain focused and visible above viewport bottom. |
| **Home Dashboard** (`/dashboard`) | Normal habit card | PASS | PASS | PASS | PASS | Pass | Card padding adjusts to viewport margins; Spark button accessible. |
| **Home Dashboard** (`/dashboard`) | Multi-line title | PASS* | PASS | PASS | PASS | Fixed | *Addressed by T46: Single-line truncation + Details expansion prevents card blowout at 320px. |
| **Habit Creation Sheet** | Open modal dialog | PASS | PASS | PASS | PASS | Pass | Bottom-sheet dialog caps at `--app-shell-width`; scrollable on small screens. |
| **Chain Overview** (`/chain`) | Active connections feed | PASS | PASS | PASS | PASS | Pass | Mapped to T34 (Connect vs Show up tabs); quiet heart button accessible. |
| **Chain Overview** (`/chain`) | Partner username label | PASS* | PASS | PASS | PASS | Fixed | *Addressed by T47: Standardized without `@` prefix. |
| **Chain Overview** (`/chain`) | Sent heart state | PASS* | PASS | PASS | PASS | Fixed | *Addressed by T48: SVG fill utility repaired in commit d4b6ac4. |
| **Chain Invite Card** (`/chain?invite=...`) | Acceptance with long title | PASS* | PASS | PASS | PASS | Fixed | *Addressed by T49: Native select with full selected title summary. |
| **Journey Overview** (`/journey`) | Consistency heatmap | PASS | PASS | PASS | PASS | Pass | Calendar grid fits within 320px shell; Memories card accessible (T38). |
| **Profile Destinations** (`/profile/*`) | Overview, Badges, Color Studio | PASS | PASS | PASS | PASS | Emulated | Emulated layout verified; physical Android hardware check retained by T30. |

---

## 3. Findings & Deduplicated Task Mapping

Every layout vulnerability noted during owner intake (Images 1–12) has been categorized and mapped directly to an owning atomic task:
1. **Title Blowout on Compact Screens**: Multi-word habit titles caused erratic card heights on 320px screens.
   - *Owner*: **T46** (Single-line truncation + Details sheet expansion).
2. **Sent Heart Icon Outline State**: Confirmed sent heart rendered with stroke but empty fill in production build.
   - *Owner*: **T48** (Fixed via `:host ::ng-deep lucide-icon.fill-rose-500 svg { fill: currentColor; }`).
3. **Invite Selector Truncation**: Truncated habit names inside the acceptance card.
   - *Owner*: **T49** (Native select element with full-width selected title display).
4. **Update Banner Layout Reflow**: The update notice caused content shift on the Welcome screen.
   - *Owner*: **T52** (Isolated to standard in-flow flex reflow; zero viewport collapse).
5. **Chain Handle Formatting**: Inconsistent `@` symbol in partner display name.
   - *Owner*: **T47** (Standardized clean display name without `@`).

---

## 4. Physical Android vs Emulated Verification Boundary

- **Emulation Scope**: All DOM scroll calculations (`scrollWidth === clientWidth`), touch target dimensions (≥44px), flexbox reflows, and keyboard avoidance were verified via automated tests and responsive viewport inspection.
- **Physical Device Scope**: As established in D-010, emulator/browser tests cannot claim physical Android PWA validation. Tasks **T30** (Profile V2 on Android Chrome/PWA) and **T56** (Cold-start Welcome styling on installed Android PWA) strictly retain ownership of physical device hardware verification.
