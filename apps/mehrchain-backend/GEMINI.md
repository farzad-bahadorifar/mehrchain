# MehrChain Backend — AI Context & Rules

> Loaded automatically when working on `apps/mehrchain-backend/`.

---

## Response Formatting (RTL/LTR)

1. Farsi text inside `<div dir="rtl">`, code blocks outside.
2. Inline English terms in backticks.

---

## Module Map

```
src/app/
├── app.module.ts              # Root module (imports all feature modules)
├── app.controller.ts          # GET /api → health check
├── app.service.ts             # Returns { message: 'Hello API' }
│
├── auth/                      # Authentication & User Registration
│   ├── auth.module.ts         # Imports PassportModule, JwtModule (30d expiry)
│   ├── auth.controller.ts     # POST register, verify-email, resend, login; GET me; DELETE account
│   ├── auth.service.ts        # Register, OTP flow, login (email/username), bcrypt, JWT
│   ├── jwt.strategy.ts        # Passport JWT strategy (Bearer token from header)
│   ├── jwt-auth.guard.ts      # @UseGuards(JwtAuthGuard)
│   ├── current-user.decorator.ts  # @CurrentUser() parameter decorator
│   ├── dto/                   # RegisterDto, LoginDto, VerifyEmailDto, ResendVerificationDto
│   └── validators/
│       └── is-valid-email.decorator.ts  # Custom validator: RFC + DNS MX + disposable block
│
├── commitments/               # Habit CRUD & Completion Tracking
│   ├── commitments.module.ts
│   ├── commitments.controller.ts  # Full CRUD + complete + archive + restore + permanent-delete
│   ├── commitments.service.ts     # Business logic, streak tracking, ownership checks
│   └── dto/                       # CreateCommitmentDto, UpdateCommitmentDto
│
├── users/                     # User Search & Public Profiles
│   ├── users.module.ts        # Imports PrismaModule
│   ├── users.controller.ts    # GET search?q=, GET :username
│   └── users.service.ts       # Case-insensitive search, public habits
│
├── mail/                      # Email Service
│   ├── mail.module.ts         # @Global() — exports MailService
│   └── mail.service.ts        # generateOtpCode(), sendVerificationEmail() (console fallback)
│
├── prisma/                    # Database Service
│   ├── prisma.module.ts       # @Global() — exports PrismaService
│   └── prisma.service.ts      # Extends PrismaClient, implements OnModuleInit/OnModuleDestroy
│
└── common/
    └── filters/
        └── all-exceptions.filter.ts  # Global exception filter (standardized error response)
```

---

## API Endpoints

All routes prefixed with `/api`. Swagger docs at `/api/docs`.

| Method | Route | Auth | DTO | Description |
|--------|-------|------|-----|-------------|
| `GET` | `/api` | — | — | Health check |
| `POST` | `/api/auth/register` | — | `RegisterDto` | Register + send OTP email |
| `POST` | `/api/auth/verify-email` | — | `VerifyEmailDto` | Verify OTP → return JWT |
| `POST` | `/api/auth/resend-verification` | — | `ResendVerificationDto` | Resend OTP code |
| `POST` | `/api/auth/login` | — | `LoginDto` | Login → return JWT |
| `GET` | `/api/auth/me` | JWT | — | Current user profile |
| `DELETE` | `/api/auth/account` | JWT | — | Delete account (cascade) |
| `GET` | `/api/commitments` | JWT | — | List active commitments |
| `POST` | `/api/commitments` | JWT | `CreateCommitmentDto` | Create commitment |
| `PATCH` | `/api/commitments/:id/complete` | JWT | — | Complete today (note in body) |
| `PATCH` | `/api/commitments/:id` | JWT | `UpdateCommitmentDto` | Update commitment |
| `GET` | `/api/commitments/archived` | JWT | — | List archived commitments |
| `DELETE` | `/api/commitments/:id` | JWT | — | Soft-delete (archive) |
| `PATCH` | `/api/commitments/:id/restore` | JWT | — | Restore from archive |
| `DELETE` | `/api/commitments/:id/permanent` | JWT | — | Hard delete |
| `GET` | `/api/users/search?q=` | JWT | — | Search users by username |
| `GET` | `/api/users/:username` | JWT | — | Public profile + public habits |

---

## Database Schema (Prisma — PostgreSQL)

### Models

| Model | Table | Key Fields |
|-------|-------|------------|
| `User` | `users` | id (UUID), email (unique), username (unique), passwordHash, isEmailVerified, verificationCode |
| `Commitment` | `commitments` | id (UUID), userId (FK→User), title, category (enum), totalDays, currentDay, currentStreak, isPublic, isArchived |
| `CommitmentLog` | `commitment_logs` | id (UUID), commitmentId (FK→Commitment), completedAt, note |
| `ChainRequest` | `chain_requests` | id (UUID), senderId (FK→User), receiverId (FK→User), senderCommitmentId, receiverCommitmentId, status (enum) |

### Enums
- `Category`: health, growth, community, environment
- `ChainRequestStatus`: PENDING, ACCEPTED, REJECTED, CANCELLED

### Key Relations
- User → Commitment (1:N, cascade delete)
- Commitment → CommitmentLog (1:N, cascade delete)
- User → ChainRequest (1:N as sender, 1:N as receiver)
- ChainRequest unique constraint: `[senderId, receiverId, senderCommitmentId]`

### Important: `ChainRequest` has NO API yet
The Prisma model exists but there is no `ChainController` or `ChainService`. See skill `chain-backend` for implementation guide.

---

## NestJS Conventions (MUST follow)

### Module Pattern
```typescript
@Module({
  imports: [PrismaModule],  // if needs DB
  controllers: [MyController],
  providers: [MyService],
  exports: [MyService],     // if other modules need it
})
export class MyModule {}
```

### Controller Pattern
```typescript
@Controller('my-resource')
export class MyController {
  constructor(private readonly myService: MyService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'List items' })
  findAll(@CurrentUser() user: User) {
    return this.myService.findAll(user.id);
  }
}
```

### DTO Pattern
```typescript
export class CreateMyDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(Category, { message: 'Category must be: health | growth | community | environment' })
  category: Category;
}
```

### Error Handling
- `NotFoundException` → 404
- `ForbiddenException` → 403 (ownership violations)
- `ConflictException` → 409 (duplicates)
- `BadRequestException` → 400 (validation)
- `UnauthorizedException` → 401 (auth failures)
- All caught by `AllExceptionsFilter` → standardized `{ statusCode, message, error, timestamp, path }`

### Service Pattern
- Always check **ownership** before mutations: `if (record.userId !== userId) throw new ForbiddenException()`
- Use **Prisma transactions** for multi-step operations
- Return **clean objects** (no password hashes, no OTP codes in responses)

---

## Validation Pipeline (Global)

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,           // Strip non-DTO properties
    transform: true,           // Auto-transform types
    forbidNonWhitelisted: true, // Throw on unknown properties
  }),
);
```

---

## Testing (Jest)

- Test files: `*.spec.ts` next to source files
- Run: `npx nx test mehrchain-backend`
- Mock JWT: Custom mock at `src/testing/jwt.mock.ts` (mapped in jest.config.cts)
- Mock Prisma: Create mock with `{ provide: PrismaService, useValue: mockPrisma }`
- Pattern: Test service methods, mock dependencies, verify both success and error paths
