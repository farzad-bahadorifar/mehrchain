/**
 * Helper script to create a GitHub Issue, assign to @farzad-bahadorifar,
 * close as completed, and output the issue number and URL.
 *
 * Usage: node scripts/create-task.js "<Title>" "<Body>"
 */

const https = require('https');
const { execSync } = require('child_process');

const GITHUB_IPS = ['140.82.121.6', '140.82.113.6', '140.82.114.6', '140.82.112.6'];

function customLookup(hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  if (hostname === 'api.github.com') {
    const ip = GITHUB_IPS[0];
    if (options && options.all) {
      return callback(null, [{ address: ip, family: 4 }]);
    }
    return callback(null, ip, 4);
  }
  require('dns').lookup(hostname, options, callback);
}

function request(options, postData) {
  return new Promise((resolve, reject) => {
    const reqOptions = {
      ...options,
      lookup: customLookup,
      servername: options.hostname,
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
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function main() {
  const title = process.argv[2];
  const body = process.argv[3] || 'Completed task.';

  if (!title) {
    console.error('Usage: node scripts/create-task.js "<Title>" "<Body>"');
    process.exit(1);
  }

  const creds = execSync('git credential fill', {
    input: 'protocol=https\nhost=github.com\n',
  }).toString();
  const tokenMatch = creds.match(/password=(.+)/);
  if (!tokenMatch) {
    throw new Error('No GitHub token found in git credentials');
  }
  const token = tokenMatch[1].trim();

  const headers = {
    'User-Agent': 'MehrChain-Bot',
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  // 1. Create Issue
  console.log(`Creating GitHub Issue: "${title}"...`);
  const createIssueRes = await request(
    {
      hostname: 'api.github.com',
      path: '/repos/farzad-bahadorifar/mehrchain/issues',
      method: 'POST',
      headers,
    },
    {
      title,
      body,
      assignees: ['farzad-bahadorifar'],
    }
  );

  const issue = createIssueRes.data;
  if (!issue || !issue.number) {
    console.error('Error creating issue:', issue);
    process.exit(1);
  }
  console.log(`Created Issue #${issue.number}: ${issue.html_url}`);

  // 2. Close the Issue as completed
  console.log(`Closing Issue #${issue.number} as completed...`);
  await request(
    {
      hostname: 'api.github.com',
      path: `/repos/farzad-bahadorifar/mehrchain/issues/${issue.number}`,
      method: 'PATCH',
      headers,
    },
    {
      state: 'closed',
      state_reason: 'completed',
    }
  );

  console.log(`\nIssue #${issue.number} created, assigned, and marked as completed!`);
  console.log(`URL: ${issue.html_url}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
