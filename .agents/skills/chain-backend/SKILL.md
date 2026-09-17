---
name: chain-backend
description: >-
  Use this skill when the user asks to build, implement, or work on the Chain
  feature backend API. This includes creating the ChainModule, ChainController,
  ChainService, and related DTOs for managing chain requests between users.
---

# Build Chain Backend API

The Chain feature is MehrChain's key differentiator — it connects users as "habit support partners." The database schema (`ChainRequest` model) already exists in Prisma, but there is NO controller or service yet.

## Current State

- ✅ Prisma model `ChainRequest` exists with `PENDING/ACCEPTED/REJECTED/CANCELLED` status
- ✅ Relations: `sender` → User, `receiver` → User, `senderCommitment` → Commitment, `receiverCommitment?` → Commitment
- ✅ Unique constraint: `[senderId, receiverId, senderCommitmentId]`
- ❌ No `ChainModule`, `ChainController`, or `ChainService` exist
- ❌ Frontend `ChainService` uses localStorage only (no API calls)

## Implementation Steps

### Step 1: Create Module Structure

Create these files in `apps/mehrchain-backend/src/app/chain/`:

```
chain/
├── chain.module.ts
├── chain.controller.ts
├── chain.service.ts
└── dto/
    ├── create-chain-request.dto.ts
    └── respond-chain-request.dto.ts
```

### Step 2: DTOs

**`create-chain-request.dto.ts`:**
- `receiverUsername: string` — `@IsNotEmpty()`, `@IsString()`
- `senderCommitmentId: string` — `@IsNotEmpty()`, `@IsUUID()`

**`respond-chain-request.dto.ts`:**
- `status: 'ACCEPTED' | 'REJECTED'` — `@IsEnum()`
- `receiverCommitmentId?: string` — `@IsOptional()`, `@IsUUID()` (required when accepting)

### Step 3: API Endpoints

| Method | Route | Auth | DTO | Description |
|--------|-------|------|-----|-------------|
| `POST` | `/api/chain/request` | JWT | `CreateChainRequestDto` | Send chain request to another user |
| `GET` | `/api/chain/requests/incoming` | JWT | — | List pending incoming requests |
| `GET` | `/api/chain/requests/outgoing` | JWT | — | List outgoing requests (all statuses) |
| `PATCH` | `/api/chain/requests/:id/respond` | JWT | `RespondChainRequestDto` | Accept or reject a request |
| `DELETE` | `/api/chain/requests/:id` | JWT | — | Cancel a sent request (PENDING only) |
| `GET` | `/api/chain/connections` | JWT | — | List active (ACCEPTED) chains with partner info |
| `DELETE` | `/api/chain/connections/:id` | JWT | — | Disconnect from a chain |

### Step 4: Service Logic

Key business rules:
1. **Cannot chain with yourself** — reject if `senderId === receiverId`
2. **Unique constraint** — one active request per (sender, receiver, commitment) combination
3. **Only PENDING requests can be accepted/rejected**
4. **Cancellation** — only the sender can cancel, only while PENDING
5. **Accept flow** — requires `receiverCommitmentId` to link the partner's habit
6. **Connections query** — return ACCEPTED requests with joined User + Commitment data

### Step 5: Register Module

In `apps/mehrchain-backend/src/app/app.module.ts`, add `ChainModule` to imports:
```typescript
imports: [PrismaModule, MailModule, AuthModule, CommitmentsModule, UsersModule, ChainModule],
```

## Validation

1. Run tests: `npx nx test mehrchain-backend`
2. Check Swagger: `http://localhost:3000/api/docs` — all chain endpoints should appear
3. Manual test: Use Swagger UI to send a chain request between two test users
4. Verify unique constraint: Sending duplicate request should return 409 Conflict
