---
name: design-system-docs
description: >-
  Use this skill when the user asks to document the design system, create a
  style guide, standardize UI components, add design tokens documentation,
  or create a UI kit reference for contributors.
---

# Document the Design System

MehrChain has an informal but functional design system built with Tailwind CSS 4, CVA-based components, and HSL CSS variables. This skill guides documenting and standardizing it.

## Current State

- ✅ CSS variables defined in `styles.css` (HSL colors, shadows, radii)
- ✅ 3 CVA-based UI primitives: McButton, McBadge, McCard
- ✅ Dark mode via class-based toggle
- ✅ Poppins font with multiple weights
- ❌ No design tokens documentation
- ❌ No component usage examples
- ❌ No spacing/sizing scale documented
- ❌ Contributors have no visual reference

## Implementation Steps

### Step 1: Create Design Tokens Document

Create `docs/design-system.md` with extracted tokens:

**Color Tokens** (from `apps/mehrchain-frontend/src/styles.css`):

| Token | Light Value | Dark Value | Usage |
|-------|-------------|------------|-------|
| `primary` | `hsl(180 100% 25%)` | `hsl(172 75% 42%)` | Brand actions, links |
| `primary-foreground` | `hsl(0 0% 100%)` | `hsl(0 0% 100%)` | Text on primary |
| `accent` | `hsl(180 100% 31%)` | `hsl(172 80% 50%)` | Secondary highlights |
| `background` | `hsl(210 20% 98%)` | `hsl(222 47% 9%)` | Page background |
| `card` | `hsl(0 0% 100%)` | `hsl(222 47% 14%)` | Card surfaces |
| `foreground` | `hsl(220 29% 17%)` | `hsl(210 40% 98%)` | Primary text |
| `muted` | `hsl(210 20% 96%)` | `hsl(217 33% 18%)` | Disabled, secondary text bg |
| `muted-foreground` | `hsl(215 16% 47%)` | `hsl(215 20% 65%)` | Secondary text |
| `border` | `hsl(210 20% 90%)` | `hsl(217 33% 22%)` | Borders, dividers |
| `destructive` | `hsl(0 84% 60%)` | `hsl(0 63% 31%)` | Delete, error |

**Category Colors:**

| Category | Color | Usage |
|----------|-------|-------|
| Health | `text-primary` / `bg-primary/10` | Heart icon, health habits |
| Environment | `text-accent` / `bg-accent/10` | Leaf icon, environment habits |
| Community | `text-teal-600` / `bg-teal-100` | Users icon, community habits |
| Growth | `text-cyan-600` / `bg-cyan-100` | TrendingUp icon, growth habits |

### Step 2: Document Component Library

For each CVA component, document:

**McButton:**
```html
<!-- Primary (default) -->
<mc-button>Save Habit</mc-button>

<!-- Secondary -->
<mc-button variant="secondary">Cancel</mc-button>

<!-- Outline -->
<mc-button variant="outline">Learn More</mc-button>

<!-- Ghost -->
<mc-button variant="ghost">Skip</mc-button>

<!-- Danger -->
<mc-button variant="danger">Delete Account</mc-button>

<!-- Sizes -->
<mc-button size="sm">Small</mc-button>
<mc-button size="lg">Large</mc-button>
<mc-button size="icon">🔔</mc-button>

<!-- Loading State -->
<mc-button [loading]="true">Saving...</mc-button>
```

**McBadge:**
```html
<mc-badge variant="primary" size="sm">Health</mc-badge>
<mc-badge variant="success" size="xs">Active</mc-badge>
<mc-badge variant="outline">3-Day Streak</mc-badge>
```

**McCard:**
```html
<mc-card variant="elevated" padding="md">
  <h3>Card Title</h3>
  <p>Card content</p>
</mc-card>

<mc-card variant="interactive" padding="lg">
  <!-- Clickable card with hover effects -->
</mc-card>
```

### Step 3: Document Spacing & Sizing

Extract the Tailwind spacing scale used in the project:
- Standard Tailwind 4 scale: `p-2` (8px), `p-3` (12px), `p-4` (16px), `p-6` (24px)
- Border radius: `rounded-lg` (1rem default), `rounded-md`, `rounded-sm`
- Shadows: `shadow-soft` (subtle), `shadow-float` (teal-tinted glow)

### Step 4: Document Icon Usage

```typescript
// Import icons in app.config.ts using LucideAngularModule.pick()
import { Heart, Leaf, Users, TrendingUp, Bell, Plus, /* ... */ } from 'lucide-angular';

// Usage in templates
<lucide-icon [img]="Heart" [size]="20" />
```

### Step 5: Document Mero Glow Themes

| Theme | Min Streak | Preview Color | Description |
|-------|-----------|---------------|-------------|
| Golden Warmth | 0 | `#f59e0b` | Default warm glow |
| Calm Breeze | 0 | `#0ea5e9` | Ocean blue |
| Cyber Nebula | 0 | `#a855f7` | Purple cosmic |
| Emerald Spring | 0 | `#22c55e` | Nature green |
| Sakura Dream | 0 | `#f43f5e` | Pink love |
| Aurora Borealis | 3 | `#14b8a6` | Multi-color northern lights |
| Cosmic Fire | 7 | `#f97316` | Orange-red determination |
| Custom | 21 | User-chosen | Hex color picker |

## Output File

Create: `docs/design-system.md`

This document should be:
- Referenced from `CONTRIBUTING.md` 
- Updated whenever new tokens or components are added
- The single source of truth for visual decisions

## Validation

1. Review: Every color, component, and pattern in the doc matches actual code
2. Review: A new contributor can find and use any UI element from this doc alone
3. Optional: Create a Storybook or simple demo page showcasing all components
