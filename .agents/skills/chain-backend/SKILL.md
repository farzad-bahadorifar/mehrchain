---
name: chain-backend
description: >-
  Use this skill when the user asks to build, implement, or work on the Chain
  feature backend API. This includes creating the ChainModule, ChainController,
  ChainService, and related DTOs for managing chain connections between users.
  Refer to docs/chain_feature_spec.md for the full design specification.
---

# Build Chain Backend API

The Chain feature connects users as habit support partners. The complete design spec is at `docs/chain_feature_spec.md`.

## Current State

- ✅ Prisma model `ChainRequest` exists (legacy — will be replaced)
- ❌ No `ChainModule`, `ChainController`, or `ChainService` exist
- ❌ Frontend `ChainService` uses localStorage only

## New Data Models (Prisma)

Replace the old `ChainRequest` model with two new models:

### `ChainConnection` — active link between two users' habits
```prisma
model ChainConnection {
  id                    String      @id @default(uuid())
  userId                String
  partnerId             String
  userCommitmentId      String
  partnerCommitmentId   String
  status                ChainStatus @default(ACTIVE)
  consecutiveMissedDays Int         @default(0)
  lastPartnerActivityAt DateTime?
  lastNudgeSentAt       DateTime?
  heartSent             Boolean     @default(false)
  createdAt             DateTime    @default(now())
  archivedAt            DateTime?

  user              User       @relation("UserChains", fields: [userId], references: [id])
  partner           User       @relation("PartnerChains", fields: [partnerId], references: [id])
  userCommitment    Commitment @relation("UserChainCommitment", fields: [userCommitmentId], references: [id])
  partnerCommitment Commitment @relation("PartnerChainCommitment", fields: [partnerCommitmentId], references: [id])

  @@unique([userId, partnerId, userCommitmentId])
}
```

### `ChainInvite` — invite link for joining a chain
```prisma
model ChainInvite {
  id                   String            @id @default(uuid())
  senderId             String
  senderCommitmentId   String
  inviteCode           String            @unique @default(uuid())
  status               ChainInviteStatus @default(PENDING)
  acceptedById         String?
  acceptedCommitmentId String?
  createdAt            DateTime          @default(now())
  expiresAt            DateTime

  sender           User       @relation(fields: [senderId], references: [id])
  senderCommitment Commitment @relation(fields: [senderCommitmentId], references: [id])
}
```

### New Enums
```prisma
enum ChainStatus {
  ACTIVE
  RESTING
  FADING
  COMPLETED
  DORMANT
  DISCONNECTED
}

enum ChainInviteStatus {
  PENDING
  ACCEPTED
  EXPIRED
  CANCELLED
}
```

## Module Structure

```
apps/mehrchain-backend/src/app/chain/
├── chain.module.ts
├── chain.controller.ts
├── chain.service.ts
├── chain-cron.service.ts          # Daily freeze/dormant checker
└── dto/
    ├── create-invite.dto.ts
    ├── accept-invite.dto.ts
    └── send-nudge.dto.ts
```

## API Endpoints

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| `POST` | `/api/chain/invite` | JWT | Generate invite for a public commitment |
| `GET` | `/api/chain/invite/:code` | — | Get invite details (public) |
| `POST` | `/api/chain/invite/:code/accept` | JWT | Accept invite with own commitment |
| `DELETE` | `/api/chain/invite/:id` | JWT | Cancel own invite |
| `GET` | `/api/chain/connections` | JWT | List active connections (sorted by lastActivityAt) |
| `POST` | `/api/chain/connections/:id/heart` | JWT | Toggle heart (once per day) |
| `POST` | `/api/chain/connections/:id/nudge` | JWT | Send nudge (only when Fading/Completed) |
| `DELETE` | `/api/chain/connections/:id` | JWT | Disconnect chain |
| `GET` | `/api/chain/unread` | JWT | Check unread activity (for navbar dot) |

## Key Business Rules

1. **Auto-notify on completion:** When `CommitmentsService.completeCommitment()` runs, also update `lastPartnerActivityAt` on all linked ChainConnections.
2. **Cannot chain with yourself.**
3. **Invite expires after 7 days.**
4. **Nudge rate-limit:** Max 1 nudge per chain per 24 hours.
5. **Heart resets daily:** `heartSent` resets to `false` at midnight.

## Daily Cron Job (`chain-cron.service.ts`)

Runs at midnight UTC via `@nestjs/schedule`:
1. For each ACTIVE/RESTING chain: check if partner completed yesterday
2. If not completed: increment `consecutiveMissedDays`
3. `missedDays == 1` → status = `RESTING`
4. `missedDays == 2` → status = `FADING`
5. `missedDays > 2` → status = `DORMANT`, archive the commitment, create Journey entry
6. Reset `heartSent` to `false` for all connections

## Implementation Steps

1. Run `npm install @nestjs/schedule` (for cron)
2. Create Prisma migration with new models
3. Create DTOs with class-validator decorators
4. Implement `ChainService` with all business logic
5. Implement `ChainCronService` for daily checks
6. Create `ChainController` with Swagger decorators
7. Register `ChainModule` in `app.module.ts`
8. Modify `CommitmentsService.completeCommitment()` to auto-notify chains

## Validation

1. Run: `npx nx test mehrchain-backend`
2. Check Swagger: `http://localhost:3000/api/docs`
3. Test: Create invite → accept → complete habit → verify partner feed updates
4. Test: Miss 2 days → verify chain goes DORMANT
5. Test: Nudge rate limit (second nudge within 24h should fail)
