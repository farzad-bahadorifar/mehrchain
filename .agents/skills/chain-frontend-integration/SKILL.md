---
name: chain-frontend-integration
description: >-
  Use this skill when the user asks to connect the frontend Chain feature to the
  backend API. This involves modifying ChainService to sync with the backend
  instead of using localStorage only, following the same pattern as CommitmentStore.
---

# Connect Chain Frontend to Backend API

The frontend `ChainService` currently operates 100% in localStorage. After the backend `ChainModule` is built (see `chain-backend` skill), this service needs to sync with the API.

## Current State

- **File**: `apps/mehrchain-frontend/src/app/core/services/chain.service.ts` (379 lines)
- **Storage**: `localStorage` key `mehrchain_chains_${userId}`
- **Data**: `HabitChain[]` with partner info, streak, reactions
- **No HTTP calls** — all mutations are local

## Target Architecture

Follow the same **optimistic local + backend sync** pattern used by `CommitmentStore`:

```
User Action → Update local signal → Save to localStorage → Call backend API
                                                              ↓
                                                    If fails: revert local
                                                    If succeeds: merge server data
```

## Implementation Steps

### Step 1: Add HTTP Methods

Inject `HttpClient` and add API call methods to `ChainService`:

```typescript
private http = inject(HttpClient);

// API methods (only called when isRemoteToken())
private apiSendRequest(receiverUsername: string, commitmentId: string) { ... }
private apiRespondRequest(requestId: string, status: string, commitmentId?: string) { ... }
private apiGetConnections(): Observable<HabitChain[]> { ... }
private apiCancelRequest(requestId: string) { ... }
```

### Step 2: Add Remote Token Check

Copy the pattern from `CommitmentStore`:

```typescript
private isRemoteToken(): boolean {
  const token = localStorage.getItem('mehrchain_auth_token_v1');
  return !!token && !token.startsWith('local_') && !token.startsWith('mock_');
}
```

### Step 3: Modify Key Methods

Methods to modify:
1. **`acceptInvite()`** → After local update, call `apiRespondRequest()`
2. **`ringBellBroadcast()`** → After local update, call API broadcast endpoint
3. **`sendReaction()`** → After local update, call API reaction endpoint
4. **`removeChain()`** → After local update, call `apiDisconnect()`
5. Add **`syncWithBackend()`** → Fetch active connections from API and merge with local data
6. Add **`sendChainRequest()`** → New method to send request via API

### Step 4: Add Sync on Load

In the constructor, after loading from localStorage, trigger a background sync:

```typescript
constructor() {
  this.reloadChains();
  // ... existing effects ...

  // Background sync when authenticated
  effect(() => {
    if (this.authService.isAuthenticated() && this.isRemoteToken()) {
      this.syncWithBackend();
    }
  });
}
```

### Step 5: Replace Demo Chain

Replace `addDemoFriendChain()` with actual user search and chain request flow:
- Search users via `GET /api/users/search?q=`
- Send chain request via `POST /api/chain/request`
- Show pending requests UI

## Validation

1. Run tests: `npx nx test mehrchain-frontend`
2. Create chain between two test users → both should see the connection
3. React (heart/cheer/nudge) → verify reaction appears on partner's side
4. Kill backend → verify app still works in local mode
5. Restart backend → verify data syncs automatically
