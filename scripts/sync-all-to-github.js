const https = require('https');

const GITHUB_IPS = ['140.82.121.6', '140.82.121.5', '140.82.113.6', '140.82.114.6', '140.82.112.6'];

function makeLookup(ip) {
  return function (hostname, options, cb) {
    if (typeof options === 'function') { cb = options; options = {}; }
    if (options && options.all) return cb(null, [{ address: ip, family: 4 }]);
    return cb(null, ip, 4);
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
        ...(options.headers || {})
      };
      const reqOptions = { ...options, headers, lookup: makeLookup(ip), servername: options.hostname || 'api.github.com', timeout: 15000 };
      const req = https.request(reqOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
          catch { resolve({ status: res.statusCode, data }); }
        });
      });
      req.on('timeout', () => req.destroy(new Error(`Timeout with IP ${ip}`)));
      req.on('error', (err) => { lastError = err; tryIp(index + 1); });
      if (postData) req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
      req.end();
    }
    tryIp(0);
  });
}

function graphql(query, variables = {}, token) {
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
      const req = https.request({
        hostname: 'api.github.com', path: '/graphql', method: 'POST',
        headers, lookup: makeLookup(ip), servername: 'api.github.com', timeout: 15000,
      }, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          try { resolve(JSON.parse(data)); } catch { resolve({ raw: data }); }
        });
      });
      req.on('timeout', () => req.destroy(new Error('Timeout')));
      req.on('error', err => { lastError = err; tryIp(index + 1); });
      req.write(body);
      req.end();
    }
    tryIp(0);
  });
}

async function main() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('GITHUB_TOKEN not set');
    process.exit(1);
  }

  const owner = 'farzad-bahadorifar';
  const repo = 'mehrchain';
  const projectId = 'PVT_kwHOAgpOTc4BkCJE';

  console.log('--- Step 1: Closing Duplicate / Already Completed Issues ---');
  const duplicatesToClose = [
    { number: 5, comment: 'Duplicate of #22 (Onboarding component refactor completed). Closing as completed.' },
    { number: 12, comment: 'Duplicate of #22 (Onboarding component refactor completed). Closing as completed.' },
    { number: 15, comment: 'Duplicate of #25 (Signed APK release workflow completed). Closing as completed.' },
    { number: 16, comment: 'Duplicate of #23 (Backend CI tests workflow completed). Closing as completed.' },
    { number: 17, comment: 'Duplicate of #24 (Resend SMTP integration completed). Closing as completed.' },
  ];

  for (const item of duplicatesToClose) {
    console.log(`Closing Issue #${item.number}...`);
    // Add comment
    await request({
      hostname: 'api.github.com',
      path: `/repos/${owner}/${repo}/issues/${item.number}/comments`,
      method: 'POST',
    }, { body: item.comment }, token);

    // Close issue
    const res = await request({
      hostname: 'api.github.com',
      path: `/repos/${owner}/${repo}/issues/${item.number}`,
      method: 'PATCH',
    }, { state: 'closed', state_reason: 'completed' }, token);

    console.log(`  Issue #${item.number} state: ${res.data.state} (${res.data.state_reason})`);
    await new Promise(r => setTimeout(r, 600));
  }

  console.log('\n--- Step 2: Fetching Project Info & Field Definitions ---');
  const projectInfo = await graphql(`
    query($projectId: ID!) {
      node(id: $projectId) {
        ... on ProjectV2 {
          id
          title
          fields(first: 30) {
            nodes {
              ... on ProjectV2Field { id name dataType }
              ... on ProjectV2SingleSelectField { id name dataType options { id name } }
              ... on ProjectV2IterationField { id name dataType configuration { iterations { id title startDate duration } } }
            }
          }
          items(first: 100) {
            nodes {
              id
              content {
                ... on Issue { id number title state stateReason }
                ... on DraftIssue { id title }
              }
            }
          }
        }
      }
      repository(owner: "${owner}", name: "${repo}") {
        issues(first: 100) {
          nodes { id number title state stateReason }
        }
      }
    }
  `, { projectId }, token);

  const fields = projectInfo.data.node.fields.nodes;
  const statusField = fields.find(f => f.name === 'Status');
  const priorityField = fields.find(f => f.name === 'Priority');
  const startDateField = fields.find(f => f.name === 'Start date');
  const targetDateField = fields.find(f => f.name === 'Target date');

  const statusMap = {};
  statusField.options.forEach(o => { statusMap[o.name] = o.id; });
  const priorityMap = {};
  priorityField.options.forEach(o => { priorityMap[o.name] = o.id; });

  console.log('Status Options:', statusMap);
  console.log('Priority Options:', priorityMap);

  const existingProjectItems = projectInfo.data.node.items.nodes;
  const repoIssues = projectInfo.data.repository.issues.nodes;
  const issueToProjectItem = {};

  existingProjectItems.forEach(item => {
    if (item.content && item.content.number) {
      issueToProjectItem[item.content.number] = item.id;
    }
  });

  console.log('\n--- Step 3: Adding Missing Issues to Project Board ---');
  for (const issue of repoIssues) {
    if (!issueToProjectItem[issue.number]) {
      console.log(`Adding Issue #${issue.number} ("${issue.title}") to project...`);
      const addRes = await graphql(`
        mutation($projectId: ID!, $contentId: ID!) {
          addProjectV2ItemById(input: { projectId: $projectId, contentId: $contentId }) {
            item { id }
          }
        }
      `, { projectId, contentId: issue.id }, token);

      const newItemId = addRes?.data?.addProjectV2ItemById?.item?.id;
      if (newItemId) {
        issueToProjectItem[issue.number] = newItemId;
        console.log(`  Added item ID: ${newItemId}`);
      } else {
        console.error(`  Failed to add #${issue.number}:`, JSON.stringify(addRes));
      }
      await new Promise(r => setTimeout(r, 600));
    }
  }

  console.log('\n--- Step 4: Updating Statuses and Roadmap Metadata on Project Items ---');

  // Define sprint metadata for all tasks
  const sprintTasksConfig = {
    // Phase 1 / Phase 2 Completed tasks
    2: { status: 'Done', priority: 'P0', start: '2026-09-20', target: '2026-09-22' },
    3: { status: 'Done', priority: 'P1', start: '2026-09-23', target: '2026-09-24' },
    4: { status: 'Done', priority: 'P2', start: '2026-09-22', target: '2026-09-23' },
    5: { status: 'Done', priority: 'P1', start: '2026-09-26', target: '2026-09-27' },
    6: { status: 'Done', priority: 'P0', start: '2026-09-21', target: '2026-09-22' },
    7: { status: 'Done', priority: 'P0', start: '2026-09-22', target: '2026-09-23' },
    8: { status: 'Done', priority: 'P1', start: '2026-09-23', target: '2026-09-24' },
    9: { status: 'Done', priority: 'P1', start: '2026-09-24', target: '2026-09-24' },
    10: { status: 'Done', priority: 'P1', start: '2026-09-24', target: '2026-09-25' },
    11: { status: 'Done', priority: 'P1', start: '2026-09-24', target: '2026-09-25' },
    12: { status: 'Done', priority: 'P1', start: '2026-09-26', target: '2026-09-27' },
    13: { status: 'Done', priority: 'P1', start: '2026-09-28', target: '2026-09-28' },
    14: { status: 'Done', priority: 'P2', start: '2026-09-28', target: '2026-09-28' },
    15: { status: 'Done', priority: 'P1', start: '2026-09-27', target: '2026-09-27' },
    16: { status: 'Done', priority: 'P1', start: '2026-09-27', target: '2026-09-27' },
    17: { status: 'Done', priority: 'P0', start: '2026-09-27', target: '2026-09-27' },
    18: { status: 'Done', priority: 'P1', start: '2026-09-24', target: '2026-09-24' },
    19: { status: 'Done', priority: 'P1', start: '2026-09-24', target: '2026-09-24' },
    20: { status: 'Backlog', priority: 'P2', start: '2026-10-15', target: '2026-10-25' }, // Deferred to v1.1
    21: { status: 'Done', priority: 'P1', start: '2026-09-24', target: '2026-09-24' },
    22: { status: 'Done', priority: 'P1', start: '2026-09-26', target: '2026-09-27' },
    23: { status: 'Done', priority: 'P1', start: '2026-09-27', target: '2026-09-27' },
    24: { status: 'Done', priority: 'P0', start: '2026-09-27', target: '2026-09-27' },
    25: { status: 'Done', priority: 'P1', start: '2026-09-27', target: '2026-09-27' },
    26: { status: 'Done', priority: 'P2', start: '2026-09-27', target: '2026-09-27' },
    27: { status: 'Done', priority: 'P1', start: '2026-09-27', target: '2026-09-27' },
    28: { status: 'Done', priority: 'P0', start: '2026-09-28', target: '2026-09-28' },
    29: { status: 'Done', priority: 'P2', start: '2026-09-30', target: '2026-09-30' },

    // v1.0.0 Launch Sprint (Oct 1 - Oct 8)
    30: { status: 'Done', priority: 'P0', start: '2026-09-30', target: '2026-10-01' }, // Day 1 - Done
    31: { status: 'Ready', priority: 'P0', start: '2026-10-01', target: '2026-10-01' }, // Day 1 - Account deletion
    32: { status: 'Ready', priority: 'P0', start: '2026-10-01', target: '2026-10-01' }, // Day 1 - Email English template
    33: { status: 'Ready', priority: 'P1', start: '2026-10-02', target: '2026-10-02' }, // Day 2 - Profile simplify
    34: { status: 'Backlog', priority: 'P1', start: '2026-10-03', target: '2026-10-03' }, // Day 3 - Journey & Badges
    35: { status: 'Backlog', priority: 'P1', start: '2026-10-03', target: '2026-10-03' }, // Day 3 - Endless Journey & Custom
    36: { status: 'Backlog', priority: 'P1', start: '2026-10-03', target: '2026-10-03' }, // Day 3 - Spark button
    37: { status: 'Backlog', priority: 'P1', start: '2026-10-04', target: '2026-10-04' }, // Day 4 - Skeleton loading
    38: { status: 'Backlog', priority: 'P2', start: '2026-10-05', target: '2026-10-05' }, // Day 5 - Articles placeholder
    39: { status: 'Backlog', priority: 'P2', start: '2026-10-05', target: '2026-10-05' }, // Day 5 - What's New section
    40: { status: 'Backlog', priority: 'P2', start: '2026-10-06', target: '2026-10-06' }, // Day 6 - Landing page & Polish
  };

  async function updateSingleSelect(itemId, fieldId, optionId) {
    return graphql(`
      mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
        updateProjectV2ItemFieldValue(input: {
          projectId: $projectId, itemId: $itemId, fieldId: $fieldId,
          value: { singleSelectOptionId: $optionId }
        }) { projectV2Item { id } }
      }
    `, { projectId, itemId, fieldId, optionId }, token);
  }

  async function updateDate(itemId, fieldId, dateStr) {
    return graphql(`
      mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $date: Date!) {
        updateProjectV2ItemFieldValue(input: {
          projectId: $projectId, itemId: $itemId, fieldId: $fieldId,
          value: { date: $date }
        }) { projectV2Item { id } }
      }
    `, { projectId, itemId, fieldId, date: dateStr }, token);
  }

  for (const [issueNumStr, cfg] of Object.entries(sprintTasksConfig)) {
    const issueNum = parseInt(issueNumStr, 10);
    const itemId = issueToProjectItem[issueNum];
    if (!itemId) {
      console.warn(`Item ID not found for issue #${issueNum}`);
      continue;
    }

    process.stdout.write(`Syncing Project Item for #${issueNum}... `);

    // Status
    if (cfg.status && statusMap[cfg.status]) {
      await updateSingleSelect(itemId, statusField.id, statusMap[cfg.status]);
    }

    // Priority
    if (cfg.priority && priorityMap[cfg.priority] && priorityField) {
      await updateSingleSelect(itemId, priorityField.id, priorityMap[cfg.priority]);
    }

    // Start Date
    if (cfg.start && startDateField) {
      await updateDate(itemId, startDateField.id, cfg.start);
    }

    // Target Date
    if (cfg.target && targetDateField) {
      await updateDate(itemId, targetDateField.id, cfg.target);
    }

    console.log(`[Status: ${cfg.status}, Priority: ${cfg.priority}, Dates: ${cfg.start} -> ${cfg.target}] ✅`);
    await new Promise(r => setTimeout(r, 400));
  }

  // Also update draft items if any
  for (const item of existingProjectItems) {
    if (item.content && item.content.title && !item.content.number) {
      const title = item.content.title;
      if (title.includes('Internal Alpha Testing')) {
        await updateDate(item.id, startDateField.id, '2026-10-07');
        await updateDate(item.id, targetDateField.id, '2026-10-08');
        await updateSingleSelect(item.id, statusField.id, statusMap['Backlog']);
        console.log(`Updated Draft "${title}" dates 2026-10-07 -> 2026-10-08`);
      } else if (title.includes('Final Documentation') || title.includes('Release Prep')) {
        await updateDate(item.id, startDateField.id, '2026-10-07');
        await updateDate(item.id, targetDateField.id, '2026-10-08');
        await updateSingleSelect(item.id, statusField.id, statusMap['Backlog']);
        console.log(`Updated Draft "${title}" dates 2026-10-07 -> 2026-10-08`);
      } else if (title.includes('Launch v1.0.0')) {
        await updateDate(item.id, startDateField.id, '2026-10-08');
        await updateDate(item.id, targetDateField.id, '2026-10-08');
        await updateSingleSelect(item.id, statusField.id, statusMap['Backlog']);
        console.log(`Updated Draft "${title}" date 2026-10-08`);
      }
    }
  }

  console.log('\n========================================');
  console.log('Project Board & Roadmap Sync COMPLETE! 🎉');
  console.log('========================================');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
