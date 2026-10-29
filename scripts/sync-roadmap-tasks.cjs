// Deprecated: this script contains historical bulk GitHub writes and must not run.
if (require.main === module) {
  console.error('Legacy bulk sync disabled. Read docs/roadmap/workflow.md and use scripts/roadmap.cjs; the owner creates issues.');
  process.exit(1);
}
/**
 * Sync Roadmap with GitHub Issues and Project Board
 *
 * 1. Close obsolete/duplicate issues (#44, #20, #48-#54) with explanatory comments.
 * 2. Delete empty ghost items from Project Board.
 * 3. Create issues for T00–T03 (record implementation complete & pushed, set project status Done).
 * 4. Create issues for T04–T09 (open, assign to @farzad-bahadorifar, add to project board with appropriate status & priority).
 * 5. Return mapped issue numbers so development_roadmap.md can be updated.
 */

const https = require('https');
const { execSync } = require('child_process');
const fs = require('fs');

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

function request(options, postData, token) {
  return new Promise((resolve, reject) => {
    let lastError;
    function tryIp(index) {
      if (index >= GITHUB_IPS.length) {
        return reject(lastError || new Error('All GitHub IPs failed'));
      }
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
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(data) });
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

function graphql(query, variables, token) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query, variables });
    let lastError;
    function tryIp(index) {
      if (index >= GITHUB_IPS.length) return reject(lastError || new Error('All IPs failed'));
      const ip = GITHUB_IPS[index];
      const req = https.request(
        {
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

// Project field and option IDs
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

async function closeIssue(issueNumber, reason, comment, token) {
  console.log(`Closing Issue #${issueNumber}...`);
  if (comment) {
    await request({
      hostname: 'api.github.com',
      path: `/repos/${OWNER}/${REPO}/issues/${issueNumber}/comments`,
      method: 'POST',
    }, { body: comment }, token);
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

async function deleteProjectItem(itemId, token) {
  console.log(`Deleting Project Item ${itemId}...`);
  const res = await graphql(`
    mutation($projectId: ID!, $itemId: ID!) {
      deleteProjectV2Item(input: { projectId: $projectId, itemId: $itemId }) {
        deletedItemId
      }
    }
  `, { projectId: PROJECT_ID, itemId }, token);
  console.log('  Deleted item:', res?.data?.deleteProjectV2Item?.deletedItemId || 'FAILED');
  await new Promise(r => setTimeout(r, 500));
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

const NEW_TASKS = [
  {
    key: 'T00',
    title: '[T00] Restore signup by aligning the deployed timezone contract',
    priority: 'P0',
    status: 'Done', // Implementation complete & pushed
    isClosed: true,
    commit: '784d1ed',
    body: `## Task T00 — Restore signup by aligning the deployed timezone contract

**Priority:** P0 for release verification. Confirm the reported signup failure is resolved before inviting new testers.  
**Commit:** \`784d1ed\`  
**Status:** Implementation complete and pushed in \`784d1ed\`. Deployed acceptance / release verification remains documented in [T00 handoff](docs/t00_review_handoff.md).

### Summary of Completed Work
- Retained supported timezone DTOs and strict unknown-field validation; added focused HTTP regression coverage for email/Google timezone persistence, UTC fallback, invalid zones and existing accounts.
- Added fresh Prisma/backend release build, embedded artifact revision/timestamp, uncached \`/api/version\` and production schema readiness checks.
- Updated isolated release-migration wrapper (\`scripts/release-migrate.cjs\`) and documented database/release verification.

### Outstanding Release Verification (Release Check)
- [ ] Verify production database target and migration history; rehearse both migrations on disposable populated copy.
- [ ] Run deployed email signup through verification, Google signup/login, existing-account login and profile retrieval through Pages proxy.
- [ ] Confirm new-account timezone persistence, existing-account compatibility and registration after PWA update.
`,
  },
  {
    key: 'T01',
    title: '[T01] Simplify the interface and desktop PWA',
    priority: 'P1',
    status: 'Done', // Implementation complete & pushed
    isClosed: true,
    commit: 'cfaf0fd',
    body: `## Task T01 — Simplify the interface and desktop PWA

**Priority:** P1  
**Commit:** \`cfaf0fd\`  
**Status:** Implementation complete and pushed in \`cfaf0fd\`. See [T01 handoff](docs/t01_review_handoff.md).

### Summary of Completed Work
- Introduced centered responsive app shell (480–560px max width on desktop, full width on mobile) aligning bottom nav, add button, banners, dialogs.
- Removed dashboard-wide streak. Habit summary keeps title, own streak, daily action and quiet finite progress. Moved category, why, reminders to accessible details. Removed week modulo dots and Endless 100% progress bar.
- Replaced Spark pulse/spin delay with clean check "Completed".
- Made Mero static across pages/wrappers; removed nickname editing and cosmetic tap animations.
- Corrected obsolete onboarding copy to Endless/Custom and removed high-pressure wording.
`,
  },
  {
    key: 'T02',
    title: '[T02] Make daily completion and streak correct',
    priority: 'P0',
    status: 'Done', // Implementation complete & pushed
    isClosed: true,
    commit: '9643bda',
    body: `## Task T02 — Make daily completion and streak correct

**Priority:** P0  
**Commit:** \`9643bda\`  
**Status:** Implementation complete and pushed in \`9643bda\`. See [T02 handoff](docs/t02_review_handoff.md).

### Summary of Completed Work
- Added server-authoritative local-day calculation for completion, streak, and missed dates based on user account IANA timezone.
- Added same-day idempotency and transaction locking (\`20261017000000_account_calendar\`).
- Implemented client-side resume/day-boundary refresh across local midnight, foreground return, and network reconnect.
- Kept cumulative progress separate from streak. Custom targets stop at goal offering Continue/Archive.
`,
  },
  {
    key: 'T03',
    title: '[T03] Archive habits and disconnect chains consistently',
    priority: 'P0',
    status: 'Done', // Implementation complete & pushed
    isClosed: true,
    commit: '2f1cff1',
    body: `## Task T03 — Archive habits and disconnect chains consistently

**Priority:** P0  
**Commit:** \`2f1cff1\`  
**Status:** Implementation complete and pushed in \`2f1cff1\`. See [T03 handoff](docs/t03_review_handoff.md) and OpenSpec [update-habit-chain-lifecycle](openspec/changes/update-habit-chain-lifecycle/tasks.md).

### Summary of Completed Work
- Two full missed dates archives the affected habit while preserving history and progress. Reconciles on reads/actions even after server sleep.
- Atomically disconnects attached reciprocal chains and invalidates outstanding invites.
- Revalidates both habits during invite acceptance (archived/private habits reject connections).
- Restore with fresh inactivity anchor and restarted streak without catch-up debt.
`,
  },
  {
    key: 'T04',
    title: '[T04] Make Chain and hearts quiet and minimal',
    priority: 'P0',
    status: 'In progress', // Next feature task to implement
    isClosed: false,
    body: `## Task T04 — Make Chain and hearts quiet and minimal

**Priority:** P0 (Next Feature Task)  
**Scope:** backend reactions, shared response types, frontend Chain service/cards and habit support summary. Depends on T02/T03.

### Action Items
- [ ] Replace retry-sensitive heart toggle with an idempotent send. Enforce the agreed sender/habit/day limit and return aggregate received count plus current sender's sent state.
- [ ] Replace named support paragraphs/toasts with a heart; show a numeral only above one, with an accessible count description. Daily expiry follows recipient habit's day.
- [ ] Keep Chain cards to partner/habit identification, one restrained current state, heart action and secondary menu. Remove redundant status text, alarm-like pulses, obsolete nudges and Coming Soon clutter.
- [ ] Keep invitations easy to find, details/disconnect reachable, and active relationships separate from history. Never expose partner streaks or rank popularity.

### Acceptance Criteria
- Two supporters produce the right count; duplicate links, retries and simultaneous requests do not inflate or undo support.
- Reload/day rollover is consistent; stale disconnected/private/archived targets reject new hearts.
- Empty and multi-partner layouts remain clear.
`,
  },
  {
    key: 'T05',
    title: '[T05] Ask and deliver a disconnect reason',
    priority: 'P1',
    status: 'In progress', // Implemented; Render deployment failed; schema/acceptance pending
    isClosed: false,
    body: `## Task T05 — Ask and deliver a disconnect reason

**Priority:** P1  
**Scope:** disconnect API/transaction, durable recipient event and compact frontend reason/receipt UI. Depends on T03; integrates with T04's menu.

**Status (October 20, updated during T10):** implemented/pushed in ed38dd6; Render history confirms backend deployment failed. The shared disconnect constants are in the unresolved DTO runtime import diagnosed under P0 T10. Schema history, compatible release and runtime acceptance remain unverified; see docs/development_roadmap.md and docs/t10_release_build_handoff.md.

### Action Items
- [x] Implement reason with Cancel and a recipient-visible preview, including “Prefer not to share” and optional explanation.
- [x] Implement one durable private receipt atomically with reciprocal disconnection; recipient-only inbox and confirmed saved dismissal.
- [x] Implement participant isolation, bounded plain text, generation-safe retry and neutral lifecycle reasons. Runtime acceptance remains pending.
- [ ] Complete T10 build repair verification, actual pending schema/recovery/release gates and owner acceptance.

### Acceptance Criteria
- Cancel changes nothing; manual disconnect updates both sides and partner receives chosen reason once.
- Verify offline return, retries, multiple relationships and account deletion. No chat, email or push infrastructure needed.
`,
  },
  {
    key: 'T06',
    title: '[T06] Permanent named-color collection with two progress paths',
    priority: 'P1',
    status: 'In progress', // Implemented; Render build failed; schema/acceptance pending
    isClosed: false,
    body: `## Task T06 — Permanent named-color collection with two progress paths

**Priority:** P1  
**Scope:** scenario C, selected October 20: private named-color collection, server progress, completion/accepted-Chain integration and additive historical migration. Depends on T02–T05.

Implementation is in ddee9ff; the later T10 investigation verified delivery to Render and a failed backend build after successful remote Prisma generation. Shared runtime imports could not resolve; T10 repairs configuration locally. Local build/tests, database migration/rehearsal and a successful matching release remain unverified. See docs/development_roadmap.md. This local definition update does not synchronize GitHub; existing task/issue mappings stay unchanged.

### Product Contract
- First slot requires one habit at 21 consecutive account dates. No combined short streaks, app visits or Chain bypass. Earned colors/slots never expire after a miss, archive, disconnection or habit deletion.
- After the unlock date, each account date with a real completion contributes at most one collection day across all habits; every 21 dates advances the shared ladder. Gaps preserve progress.
- Distinct accepted partner accounts also advance the ladder at 1, 3, 5, etc. partners, counting both participants once per pair. Invitations, multiple habits with the same person, reconnects and support do not advance it.
- Capacity is zero before the gate; afterwards it is 1 + max(floor(collectionDays / 21), ceil(acceptedPartners / 2)). Both paths share targets rather than adding duplicate rewards. Social participation remains optional.
- Save one freely editable named hex color per earned slot; one active color or the always-free default. Mero's name stays fixed. Account-scoped legacy colors require server eligibility and cannot overwrite initialized server preferences.

### Action Items
- [x] Record the precise contract first in docs/development_roadmap.md and implement permanent, isolated collection APIs and transactional source progress.
- [x] Prepare canonical schema/additive backfill, safe legacy import, compact collection UI, actual-event badges and matching Three.js/fallback colors.
- [x] Prepare regression scenarios and docs/t06_review_handoff.md; leave source changes uncommitted for review.
- [ ] Complete owner-selected execution checks, populated-copy rehearsal, matching release and runtime acceptance.

### Acceptance Criteria
- Day 20 locked; day 21 on one habit unlocks. One later date counts once; gaps retain progress. 21 collection dates OR one partner yields capacity 2; 42 OR three yields 3; reaching both never duplicates a slot.
- Reconnects/retries, multiple habits per partner and concurrent actions cannot multiply progress. Earned state survives lifecycle changes and restores on another device.
- Invalid/cross-account saves, failures, old-session replies and competing legacy imports cannot corrupt confirmed preferences. Review the handoff for migration/backfill/cascade and UI/concurrency acceptance.
`,
  },
  {
    key: 'T07',
    title: '[T07] Explain daily rules and make returning easy',
    priority: 'P1',
    status: 'In progress', // Local commit observed; execution/release/acceptance pending
    isClosed: false,
    body: `## Task T07 — Explain daily rules and make returning easy

**Priority:** P1  
**Scope:** contextual copy, create/edit habit, Journey/history, archive and return states. Integrates T02–T06.

**Status (October 20, updated during T10):** implementation is in 023b42d and Render history confirms a failed backend deployment attempt. Actual frontend deployment and runtime/PWA acceptance remain unverified. See historical docs/t07_review_handoff.md and current docs/development_roadmap.md. T10 repair and T05/T06 release prerequisites remain separate. This task definition was updated locally; no GitHub synchronization was run.

### Action Items
- [x] Shared setup/edit/quick-create daily-rule copy and discoverable Dashboard/Journey help; contextual one-miss/archive/heart/earned-slot hints.
- [x] Today's step without catch-up debt; direct archived-return/explicit Restore flow preserving effort and requiring a new invitation to reconnect.
- [x] Account-calendar history, server-date today/month, confirmed cumulative totals and explicit current per-habit streak wording; distinct activity IDs for same-named habits.
- [x] Guarded invite continuation through signup/login, explicit acceptance and complete solo use; optional collapsed private motivation; actual-heart onboarding copy.
- [ ] Owner review, selected builds/tests/typecheck/OpenSpec validation and real new/daily/one-miss/weeks-away, invite, cross-device and PWA acceptance.

### Acceptance Criteria
- A new user, daily visitor, user after one miss and user returning after weeks can identify the next action unaided.
- Dates/history agree across views and devices. No new coaching system, extra daily ritual or celebration overlay required.
`,
  },
  {
    key: 'T08',
    title: '[T08] Reduce startup and access friction within a free budget',
    priority: 'P1',
    status: 'In progress', // Committed; backend deployment failed; measurements/acceptance pending
    isClosed: false,
    body: `## Task T08 — Reduce startup and access friction within a free budget

**Priority:** P1  
**Scope:** current Pages proxy, Render/Neon request path, authentication reachability, loading/retry and foreground refresh.

**Status (October 20, updated during T10):** committed in 37ba0e3 and delivered to Render; backend build failed on inherited shared runtime imports after Prisma generation. T10 configuration repair and compatible T05/T06 release must precede deployed latency acceptance. Frontend revision and actual migration history remain uninspected. See docs/development_roadmap.md.

### Action Items
- [ ] Measure warm and idle first-action latency separately for API, database and auth provider, on representative desktop/mobile networks and with/without proxy where feasible. Keep private account data out of measurements.
- [x] Preserve T04 hidden polling/heart-send/session guards; coalesce foreground events and share pending habit/Chain/inbox/Mero reads. Defer hidden/offline automatic reads and follow up once after habit changes during collection reads/saves.
- [x] Bound and track API waits, add explicit shared session recovery, decouple confirmed auth from habit loading, preserve drafts/confirmed saves and repair neutral notice dismissal. No automatic write replay.
- [x] Prepare anonymous bounded owner-run probes and independent idle/warm protocol; review current provider limits and record provisional keep of Pages/Render/Neon. See docs/t08_review_handoff.md and openspec/changes/reduce-access-friction/tasks.md.
- [ ] Owner review and selected build/tests/typecheck/OpenSpec validation; verify foreground/read/save/session/PWA races and collect first-action measurements. No build, tests or live probes run in the implementation session.
- [ ] Only if startup remains a material blocker, run bounded Workers + existing database experiment with representative auth, hashing and transactional writes. Compare free quotas, compatibility, actual latency and maintenance cost.
- [ ] Finalize keep/migrate acceptance from measurements. Provisional keep is recorded; no provider rewrite, paid plan or keep-alive service introduced.

### Acceptance Criteria
- Identify real delay and show measured improvement or clear reason to keep current stack.
- New host must preserve auth, transactions and data recovery; no promise of zero warm-up from hello-world test.
`,
  },
  {
    key: 'T10',
    title: '[T10] Repair backend shared-module resolution',
    priority: 'P0',
    status: 'In progress', // Config repair in Changes; owner build/release acceptance pending
    isClosed: false,
    body: `## Task T10 — Repair backend shared-module resolution

**Priority:** P0 release blocker, ahead of T08 latency measurements and T09 deployed acceptance.
**Scope:** backend-only build configuration; retain existing product/API/schema and release safeguards.

Registered in the roadmap before implementation on October 20. Render T06/T08 logs show Prisma generation succeeding, then webpack failing to resolve @mehrchain/shared-data in the disconnect DTO and Mero service. Last observed live backend: 67ed08d. T00–T09 issue mappings stay unchanged; the owner will create/synchronize this new task.

### Action Items
- [x] Register/diagnose the blocker and preserve exact failed/live revision evidence.
- [x] Set the backend app tsconfig baseUrl to the workspace root; keep the canonical shared alias and root/frontend configuration unchanged.
- [x] Inspect effective resolver output and source/diff; document release handoff in docs/t10_release_build_handoff.md. No local build/tests/typecheck/Prisma/database/deployment run.
- [ ] Owner-run clean release build; verify shared values are bundled and no unpublished package is needed at startup.
- [ ] Complete actually pending T05/T06 backup/rehearsal/schema/client/recovery gates and matching backend/frontend/PWA deployment; confirm startup/readiness and intended direct/Pages revisions.

### Acceptance Criteria
- Reviewed release build succeeds and the matching compatible backend starts without shared-module errors.
- Existing auth/timezone, private-receipt and Mero routes retain their contracts. Do not close from configuration inspection alone or bypass schema readiness.
`,
  },
  {
    key: 'T09',
    title: '[T09] Verify the complete experience with two real accounts',
    priority: 'P0',
    status: 'Ready',
    isClosed: false,
    body: `## Task T09 — Verify the complete experience with two real accounts

**Priority:** P0 (Release Verification Gate)  
**Scope:** focused regression/integration tests, deployed browser/PWA acceptance and the next small human test. Depends on completed product tasks.

### Action Items
- [ ] Verify real signup/login, stable identity, sign-out/in, reload, invite-led signup, solo/public habits and reciprocal Chain acceptance using two independent browser sessions.
- [ ] Cover midnight, one miss, two misses, long absence, restore/reconnect, finite goal, day 21, multiple hearts and reason delivery. Use controlled clock for arithmetic and real PostgreSQL for transaction/race checks.
- [ ] Verify slow/unavailable API, retry, expired session and account switch. Check deletion with disposable accounts, old-token denial and preservation of other user's data. Confirm updated PWA receives new UI without losing in-flight work.
- [ ] Record tested revisions, outcomes and defects; fix blockers before inviting the next few testers.

### Acceptance Criteria
- Core journey and requested return/support rules work in intended environment; desktop installed PWA and mobile layouts pass.
- Untested paths stay explicit. A successful build or unit count alone does not prove acceptance.
`,
  },
];

async function main() {
  const token = getToken();
  if (!token) {
    console.error('No GitHub token found');
    process.exit(1);
  }

  // 1. Close #44 (duplicate of #42)
  console.log('\n--- Step 1: Closing Duplicate Issue #44 ---');
  await closeIssue(44, 'completed', 'Closed as duplicate of #42, which was already completed and verified.', token);

  // 2. Close #20 (out of scope for this iteration)
  console.log('\n--- Step 2: Closing Out-of-Scope Issue #20 ---');
  await closeIssue(20, 'not_planned', 'Closed as out of scope for current iteration. Habit completion is handled by the streamlined CSS Spark button (#36), Mero is made static (T01), and Three.js visual engine is deferred post-v1 per development_roadmap.md.', token);

  // 3. Close R2–R8 (#48–#54) as superseded by Next Iteration roadmap after field test
  console.log('\n--- Step 3: Closing Superseded Pre-Pilot Tasks #48–#54 ---');
  const recoveryIssues = [48, 49, 50, 51, 52, 53, 54];
  for (const num of recoveryIssues) {
    const comment = `Closed as superseded. The initial pilot field test was conducted, deadline passed, and learnings (timezone contract, daily boundary calculation, 2-day habit lifecycle, UI simplification) have been refactored into the active Next Iteration roadmap (T00–T09) in docs/development_roadmap.md.`;
    await closeIssue(num, 'completed', comment, token);
  }

  // 4. Update Project Board for closed issues
  console.log('\n--- Step 4: Updating Project Board status to Done for closed issues ---');
  const projectDump = JSON.parse(fs.readFileSync('project-items.json', 'utf8'));
  const projectItems = projectDump.data.node.items.nodes;

  const closedIssueNums = [20, 44, 48, 49, 50, 51, 52, 53, 54];
  for (const num of closedIssueNums) {
    const item = projectItems.find(it => it.content?.number === num);
    if (item) {
      console.log(`Setting Project Item ${item.id} (Issue #${num}) to Done...`);
      await setProjectItemStatus(item.id, STATUS_OPTIONS.Done, token);
      await new Promise(r => setTimeout(r, 400));
    }
  }

  // 5. Delete empty/ghost items from Project Board
  console.log('\n--- Step 5: Deleting Ghost Items from Project Board ---');
  const ghostItems = projectItems.filter(it => !it.content || !it.content.number);
  for (const it of ghostItems) {
    await deleteProjectItem(it.id, token);
  }

  // 6. Create new iteration issues T00–T09
  console.log('\n--- Step 6: Creating T00–T09 Issues ---');
  const createdMap = {};

  for (const task of NEW_TASKS) {
    const issue = await createIssue(task.title, task.body, [OWNER], token);
    console.log(`Created ${task.key} -> Issue #${issue.number}: ${issue.html_url}`);
    createdMap[task.key] = {
      number: issue.number,
      url: issue.html_url,
      title: task.title,
      key: task.key,
      commit: task.commit,
      status: task.status,
      isClosed: task.isClosed,
    };

    await new Promise(r => setTimeout(r, 600));

    // Add to project board
    console.log(`  Adding Issue #${issue.number} to Project Board...`);
    const itemId = await addItemToProject(issue.node_id, token);
    if (itemId) {
      console.log(`  Item added: ${itemId}`);
      // Set status
      const statusOption = task.status === 'Done' ? STATUS_OPTIONS.Done : (task.status === 'In progress' ? STATUS_OPTIONS.InProgress : STATUS_OPTIONS.Ready);
      await setProjectItemStatus(itemId, statusOption, token);

      // Set priority
      const priorityOption = PRIORITY_OPTIONS[task.priority] || PRIORITY_OPTIONS.P1;
      await setProjectItemPriority(itemId, priorityOption, token);
    }

    // If it was completed implementation (T00–T03), close the issue
    if (task.isClosed) {
      console.log(`  Closing Issue #${issue.number} (Implementation complete & pushed in ${task.commit})...`);
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

  fs.writeFileSync('created-tasks.json', JSON.stringify(createdMap, null, 2));
  console.log('\nSynchronization completed successfully! Created tasks saved to created-tasks.json');
}

main().catch(console.error);
