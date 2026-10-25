const https = require('https');
const { execSync } = require('child_process');

const GITHUB_IPS = ['140.82.121.6', '140.82.121.5', '140.82.113.6', '140.82.114.6', '140.82.112.6'];

function makeLookup(ip) {
  return function (hostname, options, cb) {
    if (typeof options === 'function') { cb = options; options = {}; }
    return cb(null, [{ address: ip, family: 4 }]);
  };
}

function getToken() {
  let token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) {
    try {
      const creds = execSync('git credential fill', { input: 'protocol=https\nhost=github.com\n\n', timeout: 5000 }).toString();
      const m = creds.match(/password=(.+)/);
      if (m) token = m[1].trim();
    } catch {}
  }
  return token;
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

const ROADMAP_ITEMS = [
  { key: 'T00', issue: 55, status: 'Done', priority: 'P0' },
  { key: 'T01', issue: 56, status: 'Done', priority: 'P1' },
  { key: 'T02', issue: 57, status: 'Done', priority: 'P1' },
  { key: 'T03', issue: 58, status: 'Done', priority: 'P1' },
  { key: 'T04', issue: 59, status: 'Done', priority: 'P1' },
  { key: 'T05', issue: 60, status: 'InProgress', priority: 'P1' },
  { key: 'T06', issue: 61, status: 'InProgress', priority: 'P1' },
  { key: 'T07', issue: 62, status: 'InProgress', priority: 'P1' },
  { key: 'T08', issue: 63, status: 'InProgress', priority: 'P1' },
  { key: 'T09', issue: 64, status: 'InProgress', priority: 'P1' },
  { key: 'T10', issue: 66, status: 'Done', priority: 'P0' },
  { key: 'T11', issue: 67, status: 'Done', priority: 'P1' },
  { key: 'T12', issue: 68, status: 'InProgress', priority: 'P0' },
  { key: 'T13', issue: 69, status: 'InProgress', priority: 'P1' },
  { key: 'T14', issue: 71, status: 'Ready', priority: 'P1' },
  { key: 'T15', issue: 72, status: 'InProgress', priority: 'P1' },
  { key: 'T16', issue: 75, status: 'InProgress', priority: 'P1' },
  { key: 'T17', issue: 76, status: 'InProgress', priority: 'P1' },
  { key: 'T18', issue: 77, status: 'InProgress', priority: 'P1' },
  { key: 'T19', issue: 78, status: 'InProgress', priority: 'P1' },
  { key: 'T20', issue: 79, status: 'Ready', priority: 'P1' },
  { key: 'T21', issue: 80, status: 'Ready', priority: 'P1' },
  { key: 'T22', issue: 81, status: 'Ready', priority: 'P1' },
  { key: 'T23', issue: 82, status: 'Ready', priority: 'P1' },
  { key: 'T24', issue: 83, status: 'Ready', priority: 'P1' },
  { key: 'T25', issue: 84, status: 'Ready', priority: 'P2' },
];

async function getIssueNodeId(issueNumber, token) {
  const res = await graphql(`
    query($owner: String!, $repo: String!, $number: Int!) {
      repository(owner: $owner, name: $repo) {
        issue(number: $number) {
          id
          title
        }
      }
    }
  `, { owner: OWNER, repo: REPO, number: issueNumber }, token);
  return res?.data?.repository?.issue?.id;
}

async function addItemToProject(contentId, token) {
  const addRes = await graphql(`
    mutation($projectId: ID!, $contentId: ID!) {
      addProjectV2ItemById(input: { projectId: $projectId, contentId: $contentId }) {
        item { id }
      }
    }
  `, { projectId: PROJECT_ID, contentId }, token);
  if (addRes.errors) {
    throw new Error(JSON.stringify(addRes.errors));
  }
  return addRes?.data?.addProjectV2ItemById?.item?.id;
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

async function sync() {
  const token = getToken();
  if (!token) {
    console.error('No token found');
    process.exit(1);
  }

  console.log('Testing Project Board access...');
  const testRes = await graphql(`
    query {
      node(id: "${PROJECT_ID}") {
        id
      }
    }
  `, {}, token);

  if (testRes.errors) {
    const insufficient = testRes.errors.find(e => e.type === 'INSUFFICIENT_SCOPES' || e.message.includes('required scopes'));
    if (insufficient) {
      console.error('FAILED: Token still lacks "project" scope.');
      console.error('Error message:', insufficient.message);
      return;
    }
  }

  console.log('Project board access granted! Syncing items...');

  for (const item of ROADMAP_ITEMS) {
    try {
      console.log(`\nSyncing ${item.key} (Issue #${item.issue})...`);
      const nodeId = await getIssueNodeId(item.issue, token);
      if (!nodeId) {
        console.warn(`  Could not find node ID for #${item.issue}`);
        continue;
      }

      const itemId = await addItemToProject(nodeId, token);
      console.log(`  Project Item ID: ${itemId}`);

      const statusOption = STATUS_OPTIONS[item.status] || STATUS_OPTIONS.Ready;
      await setProjectItemStatus(itemId, statusOption, token);

      const priorityOption = PRIORITY_OPTIONS[item.priority] || PRIORITY_OPTIONS.P1;
      await setProjectItemPriority(itemId, priorityOption, token);

      console.log(`  Set Status: ${item.status}, Priority: ${item.priority}`);
      await new Promise(r => setTimeout(r, 600));
    } catch (e) {
      console.error(`  Error syncing ${item.key}:`, e.message || e);
    }
  }

  console.log('\nAll roadmap items synced to GitHub Project Board!');
}

sync().catch(console.error);
