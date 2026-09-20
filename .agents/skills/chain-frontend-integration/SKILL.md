---
name: chain-frontend-integration
description: >-
  Use this skill when the user asks to connect the frontend Chain feature to the
  backend API, redesign the Chain page UI, or implement the minimal card design.
  Refer to docs/chain_feature_spec.md for the full design specification.
---

# Redesign & Connect Chain Frontend

The Chain page needs a complete redesign from the current emoji-heavy prototype to a minimal, passive feed. The full spec is at `docs/chain_feature_spec.md`.

## Current State (to be replaced)

- **File**: `apps/mehrchain-frontend/src/app/features/chain/chain.ts` (254 lines)
- **Service**: `apps/mehrchain-frontend/src/app/core/services/chain.service.ts` (379 lines)
- **Storage**: 100% localStorage, no API calls
- **UI**: Cluttered with emojis, 3 reaction buttons, Ring the Bell badge, demo chain

## Target Architecture

### Design Principles (from spec)
1. No emojis — use Lucide icons only
2. No streak display for partners (support, not competition)
3. One contextual action per card
4. Heart = silent, icon-only, one tap
5. Nudge = only when partner is Fading or period completed
6. Sorting by most recent activity
7. Unread dot on navbar tab

### New Component Structure

```
features/chain/
├── chain.ts                    # Page: feed + invite section
├── chain.html
├── components/
│   ├── chain-card.ts           # Minimal partner card
│   ├── chain-card.html
│   ├── invite-section.ts       # Link sharing + QR
│   └── invite-section.html
```

## Implementation Steps

### Step 1: Rewrite ChainService

Replace localStorage-only service with hybrid local + API:

```typescript
@Injectable({ providedIn: 'root' })
export class ChainService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  // Signals
  connections = signal<ChainConnection[]>([]);
  hasUnread = signal<boolean>(false);
  lastVisitAt = signal<string | null>(null);

  // API methods
  getConnections(): void { ... }
  sendHeart(connectionId: string): void { ... }
  sendNudge(connectionId: string): void { ... }
  disconnect(connectionId: string): void { ... }
  createInvite(commitmentId: string): Observable<ChainInvite> { ... }
  acceptInvite(code: string, commitmentId: string): Observable<void> { ... }
  checkUnread(): void { ... }
  markAsRead(): void { ... }
}
```

### Step 2: Create ChainConnection Interface

```typescript
export interface ChainConnection {
  id: string;
  partnerUsername: string;
  partnerHabitTitle: string;
  myHabitTitle: string;
  status: 'ACTIVE' | 'RESTING' | 'FADING' | 'COMPLETED' | 'DORMANT';
  completedToday: boolean;
  heartSent: boolean;
  lastPartnerActivityAt: string | null;
}
```

### Step 3: Build Minimal Chain Card

The card has 5 visual states based on `status` + `completedToday`:

**Normal (completed today):**
```html
<div class="p-4 bg-card rounded-2xl border border-border">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
        {{ partnerUsername[0] | uppercase }}
      </div>
      <div>
        <p class="font-semibold text-foreground">@{{ partnerUsername }}</p>
        <p class="text-sm text-muted-foreground">{{ partnerHabitTitle }}</p>
      </div>
    </div>
    <button (click)="toggleHeart()" class="p-2">
      <lucide-icon [name]="heartSent ? 'heart' : 'heart'" 
                   [class]="heartSent ? 'text-red-500 fill-red-500' : 'text-muted-foreground'" 
                   [size]="20" />
    </button>
  </div>
  <div class="mt-3 flex items-center gap-2 text-sm">
    <span class="w-2 h-2 rounded-full bg-green-500"></span>
    <span class="text-muted-foreground">Completed today</span>
  </div>
</div>
```

**Status indicators:**
- `●` Green dot = Completed today
- `○` Gray dot = Waiting for today's spark
- `◐` Amber dot = Resting today (1 day missed)
- `◌` Red dot = 2 days away (Fading) → show Nudge button
- `✓` Teal check = Completed their journey → show Congratulate button

### Step 4: Add Unread Dot to Navbar

In `app.ts`, add a teal dot on the Chain tab icon:

```html
<a routerLink="/chain" routerLinkActive="text-primary bg-primary/10" class="relative ...">
  <lucide-icon name="link" [size]="24" />
  @if (chainService.hasUnread()) {
    <span class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full"></span>
  }
  <span class="text-[10px] font-bold">Chain</span>
</a>
```

### Step 5: Remove Clutter

**From chain page:** Remove Ring the Bell, Send Love/Cheer/Nudge buttons row, demo chain, all emojis.

**From dashboard card:** Remove the `Ring Bell` button from `CommitmentCardComponent`.

**From profile page:** Remove the Personality section (Energetic/Calm/Focused).

### Step 6: Sorting & Feed Logic

```typescript
// Sort connections: most recently active first
const sorted = connections().sort((a, b) => {
  const aTime = new Date(a.lastPartnerActivityAt || 0).getTime();
  const bTime = new Date(b.lastPartnerActivityAt || 0).getTime();
  return bTime - aTime;
});
```

### Step 7: Invite Section

Keep the invite link generation and QR code, but simplify:
- Show only for public habits
- Clean layout: "Share this link to chain your habit with a friend"
- Link + QR + copy/share buttons (using Lucide icons, no emojis)

## Validation

1. Run: `npx nx test mehrchain-frontend`
2. Visual: Chain page is clean, no emojis, cards are minimal
3. Test: Complete habit → partner's card shows green dot + sorted to top
4. Test: Miss 2 days → Nudge button appears on partner's card
5. Test: Navbar shows teal unread dot when partner completes
6. Test: Heart icon toggles with one tap, no text
