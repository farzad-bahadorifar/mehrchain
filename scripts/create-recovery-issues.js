/**
 * Script to create GitHub Issues for Release Recovery assignments R0 through R8,
 * add them to the MehrChain project board, and assign to @farzad-bahadorifar.
 */

const https = require('https');
const { execSync } = require('child_process');

const GITHUB_IPS = ['140.82.121.6', '140.82.121.5', '140.82.113.6', '140.82.114.6', '140.82.112.6'];

function makeLookup(ip) {
  return function (hostname, options, cb) {
    if (typeof options === 'function') {
      cb = options;
      options = {};
    }
    if (options && options.all) {
      return cb(null, [{ address: ip, family: 4 }]);
    }
    return cb(null, ip, 4);
  };
}

function request(options, postData) {
  return new Promise((resolve, reject) => {
    let lastError;
    function tryIp(index) {
      if (index >= GITHUB_IPS.length) {
        return reject(lastError || new Error('All GitHub IPs failed'));
      }
      const ip = GITHUB_IPS[index];
      const reqOptions = {
        ...options,
        lookup: makeLookup(ip),
        servername: options.hostname,
        timeout: 15000,
      };

      const req = https.request(reqOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ status: res.statusCode, headers: res.headers, data: parsed });
          } catch {
            resolve({ status: res.statusCode, headers: res.headers, data });
          }
        });
      });

      req.on('timeout', () => {
        req.destroy(new Error(`Timeout with IP ${ip}`));
      });

      req.on('error', (err) => {
        lastError = err;
        tryIp(index + 1);
      });

      if (postData) {
        req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
      }
      req.end();
    }

    tryIp(0);
  });
}

function getToken() {
  let token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) {
    try {
      const psScript = `
Add-Type -TypeDefinition @"
using System; using System.Runtime.InteropServices; using System.Text;
public class WinCred {
    [DllImport("advapi32.dll", EntryPoint = "CredReadW", CharSet = CharSet.Unicode, SetLastError = true)]
    public static extern bool CredRead(string target, int type, int reservedFlag, out IntPtr credentialPtr);
    [DllImport("advapi32.dll", EntryPoint = "CredFree", SetLastError = true)]
    public static extern void CredFree(IntPtr cred);
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public struct CREDENTIAL {
        public int Flags; public int Type; public string TargetName; public string Comment;
        public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
        public int CredentialBlobSize; public IntPtr CredentialBlob; public int Persist;
        public int AttributeCount; public IntPtr Attributes; public string TargetAlias; public string UserName;
    }
    public static string GetPassword(string target) {
        IntPtr credPtr;
        if (CredRead(target, 1, 0, out credPtr)) {
            CREDENTIAL cred = (CREDENTIAL)Marshal.PtrToStructure(credPtr, typeof(CREDENTIAL));
            byte[] bytes = new byte[cred.CredentialBlobSize];
            Marshal.Copy(cred.CredentialBlob, bytes, 0, cred.CredentialBlobSize);
            CredFree(credPtr);
            return Encoding.Unicode.GetString(bytes);
        }
        return null;
    }
}
"@
foreach ($t in @('git:https://farzad-bahadorifar@github.com', 'git:https://github.com', 'LegacyGeneric:target=https://github.com/')) {
    $p = [WinCred]::GetPassword($t)
    if ($p) { Write-Output $p; break }
}
`;
      const encoded = Buffer.from(psScript, 'utf16le').toString('base64');
      const psOutput = execSync(`powershell -NoProfile -EncodedCommand ${encoded}`, { timeout: 8000 }).toString().trim();
      if (psOutput) {
        token = psOutput;
      }
    } catch (e) {}
  }

  if (!token) {
    try {
      const creds = execSync('git credential fill', {
        input: 'protocol=https\nhost=github.com\n\n',
        timeout: 5000,
      }).toString();
      const tokenMatch = creds.match(/password=(.+)/);
      if (tokenMatch) {
        token = tokenMatch[1].trim();
      }
    } catch {}
  }

  if (!token) {
    throw new Error('No GitHub token found in git credentials or environment variables');
  }

  return token;
}

function graphql(query, variables, token) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query, variables });
    const headers = {
      'User-Agent': 'MehrChain-Bot',
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    };

    let lastError;
    function tryIp(index) {
      if (index >= GITHUB_IPS.length) return reject(lastError || new Error('All IPs failed'));
      const ip = GITHUB_IPS[index];
      const req = https.request(
        {
          hostname: 'api.github.com',
          path: '/graphql',
          method: 'POST',
          headers,
          lookup: makeLookup(ip),
          servername: 'api.github.com',
          timeout: 15000,
        },
        (res) => {
          let data = '';
          res.on('data', (c) => (data += c));
          res.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch {
              resolve({ raw: data });
            }
          });
        }
      );
      req.on('timeout', () => req.destroy());
      req.on('error', (err) => {
        lastError = err;
        tryIp(index + 1);
      });
      req.write(body);
      req.end();
    }
    tryIp(0);
  });
}

const TASKS = [
  {
    key: 'R0',
    title: '[R0] Establish production truth (P0, read-only, Oct 4)',
    priority: 'P0',
    targetDate: '2026-10-04',
    status: 'In progress', // Project status
    body: `## Assignment R0 — Establish production truth

**Priority:** P0 (Blocks private field test)  
**Date:** October 4, 2026  
**Type:** Read-only audit  
**Scope:** \`render.yaml\`, Cloudflare Pages configuration, the deployed Render service/revision, and the exact Neon database used by Render. **No schema changes or account creation.**

---

### Execution Rule
Give one numbered assignment to one model at a time. Ask it to change only the named scope, report changed files and tests, and show concrete acceptance evidence. Keep production secrets out of prompts and logs. Mark a task complete only when its acceptance criteria pass on the intended environment. Do not infer production success from unit tests, a local cache, or an HTTP \`200\` from an unrelated route.

---

### Context & Audit Baseline
The October 4 audit established:
- **Frontend / Cloudflare Pages:** Public \`/api\` proxy answered \`200\` with \`Hello API\`. However, a working proxy root does not prove feature routes work. Confirm frontend build revision, routes, and proxy after deployment.
- **Backend / Render:** Public \`POST https://mehrchain.pages.dev/api/auth/google\` returned \`404\` on October 4, although \`AuthController\` in repository defines it. Identify deployed commit and verify routing.
- **Neon PostgreSQL:** Schema and initialization scripts exist in repo, but read-only connection from audit environment failed. Verify database URL used by Render, table/column existence, constraints, and migration history before changing schema. If database access is unavailable, record **unverified**, not **missing**.

---

### Hand-off Prompt for AI Model
\`\`\`text
Audit the deployed MehrChain stack without changing data. Record the deployed backend commit/build time, the API base URL, route responses for GET /api and a deliberately invalid POST /api/auth/google, and the database target configured in Render. With read-only SQL, report whether users, commitments, commitment_logs, chain_connections, chain_invites, and _prisma_migrations exist and whether required columns, indexes, and foreign keys match schema.prisma. Redact secrets and do not print connection strings. Return evidence, uncertainty, and exact next actions.
\`\`\`

---

### Acceptance Criteria
- [ ] A reviewer can identify the active backend revision, Render's database target, and actual schema state.
- [ ] \`404\` on \`POST /api/auth/google\` is resolved to a deployment/routing cause before any auth debugging continues.
- [ ] If database access is unavailable, record **unverified**, not **missing**.

---

### References
- \`render.yaml\`
- \`functions/api/[[path]].js\`
- \`apps/mehrchain-backend/prisma/schema.prisma\`
- \`apps/mehrchain-backend/prisma/migrations/\`

---

### Definition of Done & Review Packet
1. State exact files/configuration inspected and the deployed revision.
2. Provide direct acceptance check results (distinguish local vs production).
3. Report remaining risks and blocked dependencies without marking complete prematurely.
4. Keep all secrets, tokens, OTPs, and DB connection strings out of logs.
`,
  },
  {
    key: 'R1',
    title: '[R1] Make schema deployment safe and repeatable (P0, depends on R0, Oct 4–5)',
    priority: 'P0',
    targetDate: '2026-10-05',
    status: 'Ready',
    body: `## Assignment R1 — Make schema deployment safe and repeatable

**Priority:** P0 (Blocks private field test)  
**Date:** October 4–5, 2026  
**Depends on:** R0 (#{{R0_ISSUE}})  
**Scope:** \`apps/mehrchain-backend/prisma/schema.prisma\`, its migration directory, deployment documentation/configuration, and any existing initialization scripts. Preserve existing user data.

---

### Execution Rule
Give one numbered assignment to one model at a time. Ask it to change only the named scope, report changed files and tests, and show concrete acceptance evidence. Keep production secrets out of prompts and logs. Mark a task complete only when its acceptance criteria pass on the intended environment. Do not infer production success from unit tests, a local cache, or an HTTP \`200\` from an unrelated route.

---

### Context & Audit Baseline
The repository has a Prisma schema and manual initialization scripts, but their presence does not prove execution.
- Compare current Prisma schema to verified Render database.
- Remove \`prisma db push --accept-data-loss\` from automatic Render build path.
- Do not run manual \`CREATE TABLE IF NOT EXISTS\` scripts blindly and do not silently drop or rewrite columns.
- Prepare a reviewed, additive migration or documented baseline path.

---

### Hand-off Prompt for AI Model
\`\`\`text
Compare the current Prisma schema to the verified Render database. Prepare a reviewed, additive migration or a documented baseline path appropriate to the current database. Back up the database before applying any production change. Remove prisma db push --accept-data-loss from the automatic Render build path. Do not run manual CREATE TABLE IF NOT EXISTS scripts blindly and do not silently drop or rewrite columns. Verify the resulting tables, constraints, and Prisma Client compatibility with read-only queries.
\`\`\`

---

### Acceptance Criteria
- [ ] \`users\`, \`commitments\`, \`commitment_logs\`, \`chain_connections\`, and \`chain_invites\` have the required schema.
- [ ] Deployment has no destructive automatic schema push.
- [ ] A second deployment does not damage or duplicate data.
- [ ] Record the migration version and rollback/restore procedure.
- [ ] A historical migration directory without current chain schema is not sufficient proof.

---

### References
- \`apps/mehrchain-backend/prisma/schema.prisma\`
- \`apps/mehrchain-backend/prisma/migrations/\`
- \`render.yaml\`
- \`scripts/migrate-neon.js\`, \`scripts/init-db.js\`

---

### Definition of Done & Review Packet
1. State exact files/configuration changed and the deployed revision.
2. Show focused automated test results and migration verification check.
3. Report remaining risks and blocked dependencies.
4. Keep secrets, tokens, OTPs, and DB URLs out of the review packet.
`,
  },
  {
    key: 'R2',
    title: '[R2] Secure and deploy real authentication (P0, depends on R1, Oct 5)',
    priority: 'P0',
    targetDate: '2026-10-05',
    status: 'Ready',
    body: `## Assignment R2 — Secure and deploy real authentication

**Priority:** P0 (Blocks private field test)  
**Date:** October 5, 2026  
**Depends on:** R1 (#{{R1_ISSUE}})  
**Scope:** Backend auth controller/service, auth DTOs, mail behavior, auth-focused tests, and Render configuration; keep unrelated endpoints untouched.

---

### Execution Rule
Give one numbered assignment to one model at a time. Ask it to change only the named scope, report changed files and tests, and show concrete acceptance evidence. Keep production secrets out of prompts and logs. Mark a task complete only when its acceptance criteria pass on the intended environment.

---

### Context & Audit Baseline
- Production backend currently accepts \`mock_google_\` and \`test-google-token\`.
- Resend delivery requires a verified sender/domain. Currently API returns \`previewCode\`, and frontend auto-fills it.
- In production, reject mock tokens. Verify Google ID token validity, issuer, expiry, verified email, and \`aud\` against the configured web client ID before finding/creating a user.
- Keep same-email login stable.
- Remove \`previewCode\` from production registration and resend responses. Ensure an already-verified user cannot obtain a JWT by posting any code to \`verify-email\`.

---

### Hand-off Prompt for AI Model
\`\`\`text
In production, reject mock_google_ and test-google-token. Verify Google ID token validity, issuer, expiry, verified email, and aud against the configured web client ID before finding or creating a user. Keep same-email login stable. Remove previewCode from production registration and resend responses, and ensure an already-verified user cannot obtain a JWT by posting any code to verify-email. Add focused tests for these failures and success cases. Deploy the backend and prove the public POST /api/auth/google is routed (an invalid token should be rejected by auth, not 404).
\`\`\`

---

### Acceptance Criteria
- [ ] Mock/invalid tokens cannot create sessions in production.
- [ ] A real valid token maps repeated logins to the same database user ID.
- [ ] OTP responses do not disclose the code in production.
- [ ] An arbitrary code cannot mint a token.
- [ ] The deployed public route matches the current source (invalid token returns 401/400, not 404).

---

### References
- \`apps/mehrchain-backend/src/app/auth/auth.service.ts\`
- \`apps/mehrchain-backend/src/app/auth/auth.controller.ts\`
- \`apps/mehrchain-backend/src/app/auth/dto/\`
- \`apps/mehrchain-backend/src/app/mail/mail.service.ts\`

---

### Definition of Done & Review Packet
1. State exact files/configuration changed and deployed revision.
2. Show focused automated tests and direct acceptance evidence.
3. Report remaining risks and blocked dependencies.
4. Keep secrets, tokens, OTPs, and DB URLs out of review packet.
`,
  },
  {
    key: 'R3',
    title: "[R3] Configure the frontend's real sign-in path (P0, depends on R2, Oct 5–6)",
    priority: 'P0',
    targetDate: '2026-10-06',
    status: 'Ready',
    body: `## Assignment R3 — Configure the frontend's real sign-in path

**Priority:** P0 (Blocks private field test)  
**Date:** October 5–6, 2026  
**Depends on:** R2 (#{{R2_ISSUE}})  
**Scope:** Frontend production environment/build configuration, Google sign-in service, sign-up/login screens, and focused tests.

---

### Execution Rule
Give one numbered assignment to one model at a time. Ask it to change only the named scope, report changed files and tests, and show concrete acceptance evidence. Keep production secrets out of prompts and logs. Mark a task complete only when its acceptance criteria pass on the intended environment.

---

### Context & Audit Baseline
- Production frontend currently contains \`891234567890-mock.apps.googleusercontent.com\`; fallback creates a random local \`Tester Google\` identity.
- Replace mock Google web client ID through frontend build configuration and configure correct authorized JavaScript origin.
- Remove random-email \`Tester Google\` and local offline fallback from production sign-in.
- If One Tap is unavailable or skipped, offer a supported Google sign-in button or a clear retry/error state; never convert a failed API request into a successful local account.
- Restrict demo behavior strictly to an explicit development-only path.
- Verify server session with \`/auth/me\` on return and handle invalid tokens clearly.
- **Authentication fallback:** If Google Cloud setup cannot be completed in time, use email/password only after real OTP delivery to each tester works. Never use auto-filled \`previewCode\` as proof.

---

### Hand-off Prompt for AI Model
\`\`\`text
Replace the mock Google web client ID through the frontend build configuration and configure the correct authorized JavaScript origin. Remove random-email Tester Google and local offline fallback from production sign-in. If One Tap is unavailable or skipped, offer a supported Google sign-in button or a clear retry/error state; never convert a failed API request into a successful local account. Keep demo behavior, if needed, restricted to an explicit development-only path. On returning to the app, verify the server session with /auth/me and handle invalid tokens clearly.
\`\`\`

---

### Acceptance Criteria
- [ ] Two sign-ins with the same Google account return the same database user ID.
- [ ] A failed Google prompt, blocked script, rejected token, or unavailable backend never shows an authenticated production user.
- [ ] Tested on the actual Cloudflare Pages origin and a fresh browser profile.

---

### References
- \`apps/mehrchain-frontend/src/environments/environment.prod.ts\`
- \`apps/mehrchain-frontend/src/app/core/services/google-auth.service.ts\`
- \`apps/mehrchain-frontend/src/app/core/services/auth.service.ts\`
- \`apps/mehrchain-frontend/src/app/features/onboarding/\`

---

### Definition of Done & Review Packet
1. State exact files/configuration changed and deployed revision.
2. Show focused automated tests and direct acceptance check on Pages origin.
3. Report remaining risks and blocked dependencies.
4. Keep secrets, tokens, OTPs, and DB URLs out of review packet.
`,
  },
  {
    key: 'R4',
    title: '[R4] Persist the solo habit journey and make failures honest (P0, depends on R1–R3, Oct 5–6)',
    priority: 'P0',
    targetDate: '2026-10-06',
    status: 'Ready',
    body: `## Assignment R4 — Persist the solo habit journey and make failures honest

**Priority:** P0 (Blocks private field test)  
**Date:** October 5–6, 2026  
**Depends on:** R1 (#{{R1_ISSUE}}), R2 (#{{R2_ISSUE}}), R3 (#{{R3_ISSUE}})  
**Scope:** Backend commitment create/update DTO and service, frontend commitment store and onboarding/dashboard error handling, focused tests.

---

### Execution Rule
Give one numbered assignment to one model at a time. Ask it to change only the named scope, report changed files and tests, and show concrete acceptance evidence. Keep production secrets out of prompts and logs. Mark a task complete only when its acceptance criteria pass on the intended environment.

---

### Context & Audit Baseline
- Backend CRUD exists, but frontend retains optimistic local data when remote writes fail.
- \`isPublic\` is absent from create DTO and persistence path.
- Add and validate \`isPublic\` in backend create path and persist it.
- For a remote-authenticated user, make create, Spark, edit, archive, restore, and permanent delete report remote failures instead of silently treating local cache as success.
- Roll back optimistic state or show explicit unsynced state; choose one consistent rule.
- A solo account must be able to use the product completely without a partner.

---

### Hand-off Prompt for AI Model
\`\`\`text
Add and validate isPublic in the backend create path and persist it; verify the request payload accepted by the global validation pipe. For a remote-authenticated user, make create, Spark, edit, archive, restore, and permanent delete report remote failures instead of silently treating local cache as success. Roll back optimistic state or show an explicit unsynced state; choose one consistent rule for the field test. Preserve explicit offline/demo behavior only outside the production account path. Test create and Spark through HTTP with a real token, then reload from the server.
\`\`\`

---

### Acceptance Criteria
- [ ] A public habit is actually stored with \`isPublic=true\`; a private habit remains private.
- [ ] Server ID, Spark count/date, and history survive sign-out/sign-in and reload in a different browser.
- [ ] A failed API write cannot show an unqualified success or generate a chain invite for a local-only ID.
- [ ] A solo account can use the product without a partner.

---

### References
- \`apps/mehrchain-backend/src/app/commitments/\`
- \`apps/mehrchain-frontend/src/app/core/store/commitment.store.ts\`
- \`apps/mehrchain-frontend/src/app/core/services/commitment.service.ts\`
- \`apps/mehrchain-frontend/src/app/features/dashboard/\`

---

### Definition of Done & Review Packet
1. State exact files/configuration changed and deployed revision.
2. Show focused automated tests and direct HTTP/database reload evidence.
3. Report remaining risks and blocked dependencies.
4. Keep secrets, tokens, OTPs, and DB URLs out of review packet.
`,
  },
  {
    key: 'R5',
    title: '[R5] Use server-issued invites for the entire chain flow (P0, depends on R4, Oct 6–7)',
    priority: 'P0',
    targetDate: '2026-10-07',
    status: 'Ready',
    body: `## Assignment R5 — Use server-issued invites for the entire chain flow

**Priority:** P0 (Blocks private field test)  
**Date:** October 6–7, 2026  
**Depends on:** R4 (#{{R4_ISSUE}})  
**Scope:** Frontend ChainService, ChainComponent, InviteSection and QR/share UI, plus only the backend chain behavior required for the flow.

---

### Execution Rule
Give one numbered assignment to one model at a time. Ask it to change only the named scope, report changed files and tests, and show concrete acceptance evidence. Keep production secrets out of prompts and logs. Mark a task complete only when its acceptance criteria pass on the intended environment.

---

### Context & Audit Baseline
- Backend invite/connection APIs exist, but UI shares a commitment ID instead of a server-issued invite code and does not await acceptance.
- When selecting a persisted public habit, call \`POST /chain/invite\` and build Share, Copy, and QR URLs from returned \`inviteCode\`.
- Load incoming invite details with \`GET /chain/invite/:code\`; show expired/used/invalid states.
- Pass code and receiver's persisted habit ID to \`POST /chain/invite/:code/accept\`. Await response before showing success.
- Never manufacture a local connection for a remotely authenticated user.
- Reload connections for both users after acceptance; show API errors without a success toast.

---

### Hand-off Prompt for AI Model
\`\`\`text
When a user selects a persisted public habit, call POST /chain/invite and build Share, Copy, and QR URLs from the returned inviteCode. Load incoming invite details with GET /chain/invite/:code; show expired/used/invalid states. Pass that same code and the receiver's persisted habit ID to POST /chain/invite/:code/accept. Await the response before showing success or dismissing the invite. Never manufacture a local connection for a remotely authenticated user. Reload connections for both users after acceptance and show API errors without a success toast.
\`\`\`

---

### Acceptance Criteria
- [ ] Two real users in separate browsers each see the same new chain after refresh.
- [ ] The invite is a server record and its code is distinct from the sender's habit ID.
- [ ] Expired, invalid, or self-invite attempts fail visibly.
- [ ] Share, Copy, and QR contain the same valid URL.
- [ ] Backend refuses a non-public sender habit.

---

### References
- \`apps/mehrchain-frontend/src/app/core/services/chain.service.ts\`
- \`apps/mehrchain-frontend/src/app/features/chain/chain.ts\`
- \`apps/mehrchain-frontend/src/app/features/chain/components/invite-section/\`
- \`apps/mehrchain-backend/src/app/chain/\`

---

### Definition of Done & Review Packet
1. State exact files/configuration changed and deployed revision.
2. Show focused automated tests and two-account browser reload evidence.
3. Report remaining risks and blocked dependencies.
4. Keep secrets, tokens, OTPs, and DB URLs out of review packet.
`,
  },
  {
    key: 'R6',
    title: '[R6] Verify heart, deletion, and user data isolation (P0, Oct 7)',
    priority: 'P0',
    targetDate: '2026-10-07',
    status: 'Ready',
    body: `## Assignment R6 — Verify heart, deletion, and user data isolation

**Priority:** P0 (Blocks private field test)  
**Date:** October 7, 2026  
**Depends on:** R5 (#{{R5_ISSUE}})  
**Scope:** Chain reaction persistence, account deletion endpoint, Prisma relationships, frontend auth/chain/customization cache cleanup, and focused tests.

---

### Execution Rule
Give one numbered assignment to one model at a time. Ask it to change only the named scope, report changed files and tests, and show concrete acceptance evidence. Keep production secrets out of prompts and logs. Mark a task complete only when its acceptance criteria pass on the intended environment.

---

### Context & Audit Baseline
- Backend user deletion and main cascades exist; frontend does not clear all user-scoped caches.
- \`ChainInvite.acceptedById\` and \`acceptedCommitmentId\` are currently scalar fields, not foreign keys with cascades.
- Use two database users to verify Heart is saved and visible after reload.
- Delete one test account through the app, then query database for remaining user, commitment, log, connection, and invite records.
- Clear only the deleted user's scoped commitment, chain, visit, and customization caches.
- Check that a stale token and another signed-in account cannot see deleted user's data.

---

### Hand-off Prompt for AI Model
\`\`\`text
Use two database users to verify Heart is saved and visible after reload. Delete one test account through the app, then query the database for remaining user, commitment, log, connection, and invite records. Resolve how ChainInvite.acceptedById and acceptedCommitmentId should behave when the accepting user or habit is deleted; they are currently scalar fields, not cascading foreign keys. Clear only the deleted user's scoped commitment, chain, visit, and customization caches. Check that a stale token and another signed-in account cannot see the deleted user's data.
\`\`\`

---

### Acceptance Criteria
- [ ] Deletion succeeds only after a successful backend response.
- [ ] Removes the account's related data according to documented policy.
- [ ] Invalidates its access, and leaves no deleted user's content visible on reload or account switch.
- [ ] Heart behavior persists across reload for intended users.

---

### References
- \`apps/mehrchain-backend/src/app/chain/\`
- \`apps/mehrchain-backend/src/app/users/\`
- \`apps/mehrchain-backend/prisma/schema.prisma\`
- \`apps/mehrchain-frontend/src/app/core/services/auth.service.ts\`
- \`apps/mehrchain-frontend/src/app/features/profile/\`

---

### Definition of Done & Review Packet
1. State exact files/configuration changed and deployed revision.
2. Show focused automated tests and database query cleanup check.
3. Report remaining risks and blocked dependencies.
4. Keep secrets, tokens, OTPs, and DB URLs out of review packet.
`,
  },
  {
    key: 'R7',
    title: '[R7] Deploy and run a two-account release smoke test (P0, depends on R0–R6, Oct 7)',
    priority: 'P0',
    targetDate: '2026-10-07',
    status: 'Ready',
    body: `## Assignment R7 — Deploy and run a two-account release smoke test

**Priority:** P0 (Blocks private field test)  
**Date:** October 7, 2026  
**Depends on:** R0–R6 (#{{R0_ISSUE}}, #{{R1_ISSUE}}, #{{R2_ISSUE}}, #{{R3_ISSUE}}, #{{R4_ISSUE}}, #{{R5_ISSUE}}, #{{R6_ISSUE}})  
**Scope:** Current frontend/backend releases and an API-level or browser-level regression script limited to the release journey.

---

### Execution Rule
Give one numbered assignment to one model at a time. Ask it to change only the named scope, report changed files and tests, and show concrete acceptance evidence. Keep production secrets out of prompts and logs. Mark a task complete only when its acceptance criteria pass on the intended environment. Do not infer production success from unit tests, a local cache, or an HTTP \`200\` from an unrelated route.

---

### Context & Audit Baseline
- Deploy reviewed backend before frontend. Record both revisions and database migration version.
- On public URLs, use two test accounts on separate devices or clean browser profiles: authenticate, create private and public habits, Spark, sign out/in, check server-backed state, issue/share/accept a chain invite, refresh both sides, send Heart, and delete a disposable account.
- For each action record request outcome and fresh read from API or database.
- Repeat one failure case with backend unavailable and verify no false success.

---

### Hand-off Prompt for AI Model
\`\`\`text
Deploy the reviewed backend before the frontend. Record both revisions and the database migration version. On public URLs, use two test accounts on separate devices or clean browser profiles: authenticate, create private and public habits, Spark, sign out/in, check server-backed state, issue/share/accept a chain invite, refresh both sides, send Heart, and delete a disposable account. For each action record the request outcome and a fresh read from the API or database. Repeat one failure case with the backend unavailable and verify no false success.
\`\`\`

---

### Acceptance Criteria
- [ ] Every critical action passes on deployed services and survives a reload.
- [ ] No \`Tester Google\`, mock token, local-only habit, or local-only chain appears in the test.
- [ ] Record failures with reproduction steps.
- [ ] Unit-test totals alone do not satisfy this gate.

---

### References
- Cloudflare Pages production URL: \`https://mehrchain.pages.dev\`
- Public API root / proxy: \`/api\`
- \`render.yaml\`
- \`docs/development_roadmap.md\`

---

### Definition of Done & Review Packet
1. State exact deployed revisions and database migration version.
2. Provide step-by-step log of two-account smoke test with HTTP/browser evidence.
3. Report remaining risks and defects.
4. Keep secrets, tokens, OTPs, and DB URLs out of review packet.
`,
  },
  {
    key: 'R8',
    title: '[R8] Run the private field test and decide on launch (P0 Decision Gate, Oct 7–8)',
    priority: 'P0',
    targetDate: '2026-10-08',
    status: 'Ready',
    body: `## Assignment R8 — Run the private field test and decide on launch

**Priority:** P0 (Release Decision Gate)  
**Date:** October 7–8, 2026  
**Depends on:** R7 (#{{R7_ISSUE}})  
**Scope:** 5–10 invited friends/family; no new feature work during the test except blocker fixes.

---

### Execution Rule
Give one numbered assignment to one model at a time. Ask it to change only the named scope, report changed files and tests, and show concrete acceptance evidence. Keep production secrets out of prompts and logs. Mark a task complete only when its acceptance criteria pass on the intended environment.

---

### Context & Audit Baseline
- After R7 passes, invite 5–10 testers in two waves.
- Ask each to complete account creation, first habit, Spark, sign-out/sign-in, and—where paired—chain invite/acceptance.
- Record device/browser, where they stopped, exact error, task completion, and whether data survived reload.
- Use disposable accounts for deletion.
- Triage P0 data loss/auth/security defects immediately; defer cosmetic feedback.
- Re-run R7 after every deployed blocker fix.
- **Go / No-Go Decision Gate:** If R7 is not green by October 7, postpone external testing or label it explicitly as a UI-only preview; if R8 exposes unresolved P0 defects, postpone the October 8 release tag and announcement.

---

### Hand-off Prompt for AI Model
\`\`\`text
After R7 passes, invite 5–10 testers in two waves. Ask each to complete account creation, first habit, Spark, sign-out/sign-in, and—where paired—chain invite/acceptance. Record device/browser, where they stopped, exact error, task completion, and whether data survived reload. Use disposable accounts for deletion. Triage P0 data loss/auth/security defects immediately; defer cosmetic feedback. Re-run R7 after every deployed blocker fix.
\`\`\`

---

### Acceptance Criteria
- [ ] At least two internal accounts and the invited testers exercise the real database flow.
- [ ] All P0 defects are resolved and rechecked.
- [ ] Public v1.0 launch requires a separate go/no-go review.
- [ ] If R7 is not green by October 7, postpone external testing or label as UI preview.
- [ ] If R8 exposes unresolved P0 defects, postpone October 8 tag and announcement.

---

### References
- \`docs/development_roadmap.md\`

---

### Definition of Done & Review Packet
1. Record summary of tester results (device, browser, completion rate, blockers).
2. Document all triage actions taken on reported defects.
3. Explicit Go / No-Go statement with rationale.
`,
  },
];

const PROJECT_ID = 'PVT_kwHOAgpOTc4BkCJE';
const STATUS_FIELD_ID = 'PVTSSF_lAHOAgpOTc4BkCJEzhi0Q2M';
const PRIORITY_FIELD_ID = 'PVTSSF_lAHOAgpOTc4BkCJEzhi0Q-I';
const STATUS_OPTIONS = {
  Backlog: 'f75ad846',
  Ready: '61e4505c',
  'In progress': '47fc9ee4',
  'In review': 'df73e18b',
  Done: '98236657',
};
const PRIORITY_OPTIONS = {
  P0: '79628723',
  P1: '0a877460',
  P2: 'da944a9c',
};

async function main() {
  const token = getToken();
  console.log('Using GitHub Token...');

  const headers = {
    'User-Agent': 'MehrChain-Bot',
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  const createdIssues = {};

  // Step 1: Create all issues sequentially
  for (const task of TASKS) {
    let body = task.body;
    // Replace dependency placeholders if already known
    for (const [key, num] of Object.entries(createdIssues)) {
      body = body.replace(new RegExp(`{{${key}_ISSUE}}`, 'g'), num);
    }

    console.log(`\nCreating GitHub Issue for ${task.key}: "${task.title}"...`);
    const res = await request(
      {
        hostname: 'api.github.com',
        path: '/repos/farzad-bahadorifar/mehrchain/issues',
        method: 'POST',
        headers,
      },
      {
        title: task.title,
        body,
        assignees: ['farzad-bahadorifar'],
        labels: ['release-recovery', task.priority],
      }
    );

    const issue = res.data;
    if (!issue || !issue.number) {
      console.error('Failed to create issue:', res);
      throw new Error(`Failed to create issue for ${task.key}`);
    }

    createdIssues[task.key] = issue.number;
    console.log(`Created Issue #${issue.number} (Node ID: ${issue.node_id})`);

    // Step 2: Add issue to GitHub Project V2
    console.log(`Adding Issue #${issue.number} to Project Board...`);
    const addItemRes = await graphql(
      `
        mutation($projectId: ID!, $contentId: ID!) {
          addProjectV2ItemById(input: { projectId: $projectId, contentId: $contentId }) {
            item { id }
          }
        }
      `,
      { projectId: PROJECT_ID, contentId: issue.node_id },
      token
    );

    const itemId = addItemRes?.data?.addProjectV2ItemById?.item?.id;
    if (itemId) {
      console.log(`Added to Project! Item ID: ${itemId}`);

      // Set Status field
      const statusOptionId = STATUS_OPTIONS[task.status] || STATUS_OPTIONS['Ready'];
      await graphql(
        `
          mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
            updateProjectV2ItemFieldValue(
              input: {
                projectId: $projectId
                itemId: $itemId
                fieldId: $fieldId
                value: { singleSelectOptionId: $optionId }
              }
            ) {
              projectV2Item { id }
            }
          }
        `,
        {
          projectId: PROJECT_ID,
          itemId,
          fieldId: STATUS_FIELD_ID,
          optionId: statusOptionId,
        },
        token
      );
      console.log(`Set Status to: ${task.status}`);

      // Set Priority field
      const priorityOptionId = PRIORITY_OPTIONS[task.priority] || PRIORITY_OPTIONS['P0'];
      await graphql(
        `
          mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
            updateProjectV2ItemFieldValue(
              input: {
                projectId: $projectId
                itemId: $itemId
                fieldId: $fieldId
                value: { singleSelectOptionId: $optionId }
              }
            ) {
              projectV2Item { id }
            }
          }
        `,
        {
          projectId: PROJECT_ID,
          itemId,
          fieldId: PRIORITY_FIELD_ID,
          optionId: priorityOptionId,
        },
        token
      );
      console.log(`Set Priority to: ${task.priority}`);
    } else {
      console.warn('Could not add item to project board:', addItemRes);
    }
  }

  // Update bodies of earlier issues if they reference later issues (e.g. R7 referencing R0-R6)
  console.log('\nChecking dependency references in issue descriptions...');
  for (const task of TASKS) {
    const issueNum = createdIssues[task.key];
    let updatedBody = task.body;
    for (const [key, num] of Object.entries(createdIssues)) {
      updatedBody = updatedBody.replace(new RegExp(`{{${key}_ISSUE}}`, 'g'), num);
    }

    if (updatedBody !== task.body) {
      console.log(`Updating Issue #${issueNum} with resolved issue numbers...`);
      await request(
        {
          hostname: 'api.github.com',
          path: `/repos/farzad-bahadorifar/mehrchain/issues/${issueNum}`,
          method: 'PATCH',
          headers,
        },
        { body: updatedBody }
      );
    }
  }

  console.log('\nAll issues successfully created and linked:');
  console.log(JSON.stringify(createdIssues, null, 2));

  // Write issue map to file for easy reference
  const fs = require('fs');
  fs.writeFileSync('scripts/created-recovery-issues.json', JSON.stringify(createdIssues, null, 2));
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
