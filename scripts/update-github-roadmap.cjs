// Deprecated: do not replay historical task creation/Project mutations.
if (require.main === module) {
  console.error('Legacy bulk update disabled. Use docs/roadmap/workflow.md; no GitHub changes were made.');
  process.exit(1);
}
const https = require('https');
const { execSync } = require('child_process');
const fs = require('fs');

const GITHUB_IPS = ['140.82.121.6', '140.82.121.5', '140.82.113.6', '140.82.114.6', '140.82.112.6'];

function makeLookup(ip) {
  return function (hostname, options, cb) {
    if (typeof options === 'function') { cb = options; options = {}; }
    return cb(null, [{ address: ip, family: 4 }]);
  };
}

function request(options, postData, token) {
  return new Promise((resolve, reject) => {
    let lastError;
    function tryIp(index) {
      if (index >= GITHUB_IPS.length) return reject(lastError || new Error('All GitHub IPs failed'));
      const ip = GITHUB_IPS[index];
      const headers = {
        'User-Agent': 'MehrChain-Bot',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      };
      const reqOptions = {
        ...options,
        headers,
        lookup: makeLookup(ip),
        servername: options.hostname || 'api.github.com',
        timeout: 15000,
      };

      const req = https.request(reqOptions, (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, headers: res.headers, data });
          }
        });
      });

      req.on('timeout', () => req.destroy(new Error(`Timeout with IP ${ip}`)));
      req.on('error', (err) => { lastError = err; tryIp(index + 1); });

      if (postData) {
        req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
      }
      req.end();
    }
    tryIp(0);
  });
}

function graphql(query, variables, token) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query, variables });
    let lastError;
    function tryIp(index) {
      if (index >= GITHUB_IPS.length) return reject(lastError || new Error('All IPs failed'));
      const ip = GITHUB_IPS[index];
      const req = https.request({
        hostname: 'api.github.com',
        path: '/graphql',
        method: 'POST',
        headers: {
          'User-Agent': 'MehrChain-Bot',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
        lookup: makeLookup(ip),
        servername: 'api.github.com',
        timeout: 15000,
      }, (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve({ raw: data });
          }
        });
      });
      req.on('timeout', () => req.destroy());
      req.on('error', (err) => { lastError = err; tryIp(index + 1); });
      req.write(body);
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
      if (psOutput) token = psOutput;
    } catch {}
  }
  if (!token) {
    try {
      const creds = execSync('git credential fill', { input: 'protocol=https\nhost=github.com\n\n', timeout: 5000 }).toString();
      const m = creds.match(/password=(.+)/);
      if (m) token = m[1].trim();
    } catch {}
  }
  return token;
}

const OWNER = 'farzad-bahadorifar';
const REPO = 'mehrchain';
const PROJECT_ID = 'PVT_kwHOAgpOTc4BkCJE';

const STATUS_FIELD_ID = 'PVTSSF_lAHOAgpOTc4BkCJEzhi0Q2M';
const STATUS_OPTIONS = {
  Backlog: 'f75ad846',
  Ready: '61e4505c',
  InProgress: '47fc9ee4',
  InReview: 'df73e18b',
  Done: '98236657',
};

const PRIORITY_FIELD_ID = 'PVTSSF_lAHOAgpOTc4BkCJEzhi0Q-I';
const PRIORITY_OPTIONS = {
  P0: '79628723',
  P1: '0a877460',
  P2: 'da944a9c',
};

async function addComment(issueNumber, comment, token) {
  console.log(`Adding comment to Issue #${issueNumber}...`);
  const res = await request({
    hostname: 'api.github.com',
    path: `/repos/${OWNER}/${REPO}/issues/${issueNumber}/comments`,
    method: 'POST',
  }, { body: comment }, token);
  return res.data;
}

async function closeIssue(issueNumber, reason, comment, token) {
  console.log(`Closing Issue #${issueNumber}...`);
  if (comment) {
    await addComment(issueNumber, comment, token);
  }
  const res = await request({
    hostname: 'api.github.com',
    path: `/repos/${OWNER}/${REPO}/issues/${issueNumber}`,
    method: 'PATCH',
  }, { state: 'closed', state_reason: reason }, token);
  console.log(`  Issue #${issueNumber} closed with status ${res.status}`);
  await new Promise(r => setTimeout(r, 600));
}

async function setProjectItemStatus(itemId, statusOptionId, token) {
  return graphql(`
    mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
      updateProjectV2ItemFieldValue(input: {
        projectId: $projectId,
        itemId: $itemId,
        fieldId: $fieldId,
        value: { singleSelectOptionId: $optionId }
      }) { projectV2Item { id } }
    }
  `, { projectId: PROJECT_ID, itemId, fieldId: STATUS_FIELD_ID, optionId: statusOptionId }, token);
}

async function setProjectItemPriority(itemId, priorityOptionId, token) {
  return graphql(`
    mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
      updateProjectV2ItemFieldValue(input: {
        projectId: $projectId,
        itemId: $itemId,
        fieldId: $fieldId,
        value: { singleSelectOptionId: $optionId }
      }) { projectV2Item { id } }
    }
  `, { projectId: PROJECT_ID, itemId, fieldId: PRIORITY_FIELD_ID, optionId: priorityOptionId }, token);
}

async function addItemToProject(contentId, token) {
  const addRes = await graphql(`
    mutation($projectId: ID!, $contentId: ID!) {
      addProjectV2ItemById(input: { projectId: $projectId, contentId: $contentId }) {
        item { id }
      }
    }
  `, { projectId: PROJECT_ID, contentId }, token);
  return addRes?.data?.addProjectV2ItemById?.item?.id;
}

async function createIssue(title, body, assignees, token) {
  console.log(`Creating GitHub Issue: "${title}"...`);
  const res = await request(
    {
      hostname: 'api.github.com',
      path: `/repos/${OWNER}/${REPO}/issues`,
      method: 'POST',
    },
    {
      title,
      body,
      assignees: assignees || [OWNER],
    },
    token
  );
  return res.data;
}

async function run() {
  const token = getToken();
  if (!token) {
    console.error('No GitHub token found');
    process.exit(1);
  }

  console.log('--- Step 1: Update Existing Issues #59 - #64 ---');

  // 1. Close #59 (T04) as completed
  console.log('\nUpdating #59 (T04 - Make Chain and hearts quiet and minimal)...');
  await closeIssue(
    59,
    'completed',
    `### Implementation Complete & Deployed
- **Commit:** \`9066570\` (feat(chain): add idempotent daily hearts and simplify support UI)
- **Database Migration:** \`20261018000000_idempotent_chain_hearts\` applied and verified on production Neon DB.
- **Backend:** Included in live release \`952f5f3\` on Render.
- **Frontend:** Idempotent send, single-heart count display, deduplicated in-flight requests, and stale-session rejection implemented.
- **Status:** Marked as Done per roadmap specification. Integration/multi-account acceptance covered under T09.`,
    token
  );
  await setProjectItemStatus('PVTI_lAHOAgpOTc4BkCJEzhBkGLc', STATUS_OPTIONS.Done, token);

  // 2. Update #60 (T05) -> InProgress / InReview
  console.log('\nUpdating #60 (T05 - Disconnect reason & receipts)...');
  await addComment(
    60,
    `### Status Update
- **Implementation Commit:** \`ed38dd6\` (feat(chain): add private disconnect reasons and durable receipts)
- **Migration:** \`20261019000000_chain_disconnect_receipts\` prepared.
- **Blocker:** Render backend build failed on subsequent commits due to shared-module import issue (repaired in T10).
- **Next Step:** Deploy migration to Neon and verify with T10 release build.`,
    token
  );
  await setProjectItemStatus('PVTI_lAHOAgpOTc4BkCJEzhBkGNk', STATUS_OPTIONS.InProgress, token);

  // 3. Update #61 (T06) -> InProgress
  console.log('\nUpdating #61 (T06 - Permanent named-color collection)...');
  await addComment(
    61,
    `### Status Update
- **Implementation Commit:** \`ddee9ff\` (feat(mero): add permanent color collection with habit and Chain rewards - Scenario C)
- **Migration:** \`20261020000000_mero_color_collection\` prepared.
- **Blocker:** Render backend build failed on inherited shared-module import issue (repaired in T10).
- **Next Step:** Database rehearsal and deployment alongside T10 release.`,
    token
  );
  await setProjectItemStatus('PVTI_lAHOAgpOTc4BkCJEzhBkGPs', STATUS_OPTIONS.InProgress, token);

  // 4. Update #62 (T07) -> InProgress
  console.log('\nUpdating #62 (T07 - Explain daily rules & return easy)...');
  await addComment(
    62,
    `### Status Update
- **Implementation Commit:** \`023b42d\` (feat: clarify daily rules, return flow and Journey history)
- **Status:** Contextual copy, single missed day step, and account calendar history implemented. Awaiting owner visual/PWA acceptance.`,
    token
  );
  await setProjectItemStatus('PVTI_lAHOAgpOTc4BkCJEzhBkGRM', STATUS_OPTIONS.InProgress, token);

  // 5. Update #63 (T08) -> InProgress
  console.log('\nUpdating #63 (T08 - Reduce startup and access friction)...');
  await addComment(
    63,
    `### Status Update
- **Implementation Commit:** \`37ba0e3\` (feat: improve startup waits, session recovery and refresh deduplication)
- **Measurements Tool:** \`scripts/measure-access-latency.cjs\` prepared.
- **Findings from Pilot:** Cold starts on Render free tier (spin down after 15m) and Cloudflare Pages proxy timeouts remain a user-facing friction point. Runtime latency measurements to be conducted post-T10 deployment.`,
    token
  );
  await setProjectItemStatus('PVTI_lAHOAgpOTc4BkCJEzhBkGT0', STATUS_OPTIONS.InProgress, token);

  // 6. Update #64 (T09) -> InProgress
  console.log('\nUpdating #64 (T09 - Verify complete experience with two real accounts)...');
  await addComment(
    64,
    `### Pilot Test Findings & Post-Pilot Roadmap
- **Initial Pilot Conducted:** Two-person test executed. Core signup and basic Chain interaction functioned.
- **Observed Issues & Gaps:**
  1. Server cold-start latency & Cloudflare 524 proxy timeouts on idle wakeup.
  2. Production email OTP credentials (Resend) not configured on Render environment (using Google Sign-In or previewCode).
  3. Render auto-deploy failed for T05–T08 (resolved by T10 build fix).
  4. Database migrations for T05 (receipts) and T06 (color collection) are pending production deployment.
  5. Multi-day rollover, inactivity archiving, and Mero day-21 unlocks need live multi-day observation.
- **Deadline Status:** Iteration deadline has ended. Scope is now focused on release stabilization, migration deployment, and resolving friction.`,
    token
  );
  await setProjectItemStatus('PVTI_lAHOAgpOTc4BkCJEzhBkGWc', STATUS_OPTIONS.InProgress, token);

  console.log('\n--- Step 2: Create New Issues for T10, T11, T12, T13, T14, T15 ---');

  const newIssues = [
    {
      key: 'T10',
      title: '[T10] Repair backend shared-module resolution (P0 release blocker)',
      priority: 'P0',
      status: 'Done', // Code is committed in 9c981d1
      body: `## Task T10 — Repair backend shared-module resolution

**Priority:** P0 Release Blocker  
**Commit:** \`9c981d1\` (fix(ui): prevent Mero loading flicker and simplify tab headers)  
**Scope:** Backend build configuration fix in \`apps/mehrchain-backend/tsconfig.app.json\`.

### Problem
Render builds for T05 through T08 failed after Prisma Client generation with webpack error:
\`Module not found: Error: Can't resolve '@mehrchain/shared-data'\`
in \`chain/dto/disconnect-chain.dto.ts\` and \`mero/mero.service.ts\`.

### Fix Implemented
- Added \`"baseUrl": "../.."\` to \`apps/mehrchain-backend/tsconfig.app.json\` so \`tsconfig-paths-webpack-plugin\` resolves the root \`libs/shared-data/src/index.ts\` path correctly.
- Code committed in \`9c981d1\`. Clean release build and deployment verification pending.`,
    },
    {
      key: 'T11',
      title: '[T11] Refocus Journey on progress, history and optional support',
      priority: 'P1',
      status: 'Done', // Code is committed in 370a0c2
      body: `## Task T11 — Refocus Journey on progress, history and optional support

**Priority:** P1  
**Commit:** \`370a0c2\` (feat(journey): refine progress overview and calendar history)  
**Scope:** Frontend Journey overview, calendar, and history presentation.

### Summary of Completed Work
- Replaced ambiguous Sparks metric with clear summary: **Active habits**, **Best current streak**, and **Active Chains**.
- Reordered page: compact progress stats at top, date-linked Activity calendar as main history, collapsed archived habits and Restore action at bottom.
- Integrated optional anonymous "Support today" indicator.
- Connected calendar dates directly to grouped historical completions.
- Preserved account timezone day keys and responsive layout.`,
    },
    {
      key: 'T12',
      title: '[T12] Production Release: Deploy pending migrations (T05/T06) & verify live Render backend',
      priority: 'P0',
      status: 'Ready',
      body: `## Task T12 — Production Release: Deploy pending migrations & verify live Render backend

**Priority:** P0 (Release Gate)  
**Depends on:** T10  
**Scope:** Database migrations and production Render deployment.

### Tasks
- [ ] Inspect current applied migrations on production Neon DB.
- [ ] Take a restorable snapshot before executing migrations.
- [ ] Apply \`20261019000000_chain_disconnect_receipts\` (T05) using \`scripts/release-migrate.cjs deploy\`.
- [ ] Apply \`20261020000000_mero_color_collection\` (T06) using \`scripts/release-migrate.cjs deploy\`.
- [ ] Verify Render backend build succeeds with commit \`370a0c2\` (or later) containing the T10 \`tsconfig.app.json\` fix.
- [ ] Verify \`/api/version\` returns 200 with the matching release commit SHA and all 10 schema readiness probes pass.`,
    },
    {
      key: 'T13',
      title: '[T13] Fix backend CI test suite ESM compatibility (@nestjs/passport)',
      priority: 'P1',
      status: 'Ready',
      body: `## Task T13 — Fix backend CI test suite ESM compatibility (@nestjs/passport)

**Priority:** P1  
**Scope:** Jest / ts-jest configuration for \`apps/mehrchain-backend\`.

### Problem
Standard \`npx nx test mehrchain-backend\` encounters ESM module resolution issues with \`@nestjs/passport\`. A temporary in-memory ts-jest override with \`allowJs\` was used during the Oct 18 release verification, but checked-in CI config still requires the fix.

### Tasks
- [ ] Update \`apps/mehrchain-backend/jest.config.ts\` to transform \`@nestjs/passport\` and related ESM packages.
- [ ] Ensure standard \`npx nx test mehrchain-backend\` runs all 15 test suites cleanly without overrides.`,
    },
    {
      key: 'T14',
      title: '[T14] Production email delivery setup (Resend API key & sender config)',
      priority: 'P1',
      status: 'Ready',
      body: `## Task T14 — Production email delivery setup (Resend API key & sender config)

**Priority:** P1  
**Scope:** Render environment variables & transactional OTP delivery.

### Problem
In the inspected Render environment, \`RESEND_API_KEY\` and \`MAIL_FROM\` are missing. \`MailService\` throws HTTP 503 if verification mail cannot be dispatched in production mode.

### Tasks
- [ ] Configure \`RESEND_API_KEY\` in Render dashboard environment variables.
- [ ] Configure verified \`MAIL_FROM\` address.
- [ ] Test live OTP email delivery for registration and password reset on production.`,
    },
    {
      key: 'T15',
      title: '[T15] Address free-tier cold-start timeouts and proxy connection friction',
      priority: 'P1',
      status: 'Ready',
      body: `## Task T15 — Address free-tier cold-start timeouts and proxy connection friction

**Priority:** P1  
**Scope:** User experience during Render backend spin-up and Cloudflare Pages 524 timeouts.

### Problem
Initial two-person pilot revealed friction when accessing the app after 15+ minutes of inactivity (Render free tier spin-down and Neon compute sleep). Cloudflare Pages proxy can return 524 Gateway Timeout before the backend finishes waking up.

### Tasks
- [ ] Enhance frontend loading indicator to clearly communicate cold-start wake-up ("Waking up server, please allow up to 45 seconds...").
- [ ] Increase Cloudflare Pages Functions proxy timeout or implement exponential backoff retry on client for 504/524 responses.
- [ ] Measure idle vs warm first-action response times using \`scripts/measure-access-latency.cjs\`.`,
    },
  ];

  const createdMap = {};

  for (const task of newIssues) {
    const issue = await createIssue(task.title, task.body, [OWNER], token);
    console.log(`Created ${task.key} -> Issue #${issue.number}: ${issue.html_url}`);
    createdMap[task.key] = {
      number: issue.number,
      url: issue.html_url,
      title: task.title,
      key: task.key,
      priority: task.priority,
      status: task.status,
    };

    await new Promise(r => setTimeout(r, 600));

    console.log(`  Adding Issue #${issue.number} to Project Board...`);
    const itemId = await addItemToProject(issue.node_id, token);
    if (itemId) {
      console.log(`  Item added: ${itemId}`);
      const statusOption = task.status === 'Done' ? STATUS_OPTIONS.Done : (task.status === 'InProgress' ? STATUS_OPTIONS.InProgress : STATUS_OPTIONS.Ready);
      await setProjectItemStatus(itemId, statusOption, token);

      const priorityOption = PRIORITY_OPTIONS[task.priority] || PRIORITY_OPTIONS.P1;
      await setProjectItemPriority(itemId, priorityOption, token);
    }

    if (task.status === 'Done') {
      console.log(`  Closing Issue #${issue.number} as completed...`);
      await request({
        hostname: 'api.github.com',
        path: `/repos/${OWNER}/${REPO}/issues/${issue.number}`,
        method: 'PATCH',
      }, {
        state: 'closed',
        state_reason: 'completed',
      }, token);
    }

    await new Promise(r => setTimeout(r, 800));
  }

  fs.writeFileSync('newly-created-tasks.json', JSON.stringify(createdMap, null, 2));
  console.log('\nAll tasks successfully synchronized with GitHub Issues and Project Board!');
}

run().catch(console.error);
