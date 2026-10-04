const https = require('https');
const { execSync } = require('child_process');
const GITHUB_IPS = ['140.82.121.6', '140.82.121.5'];
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
let token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
if (!token) {
  try {
    const creds = execSync('git credential fill', { input: 'protocol=https\nhost=github.com\n\n' }).toString();
    const m = creds.match(/password=(.+)/);
    if (m) token = m[1].trim();
  } catch(e) {}
}
function graphql(query, variables = {}) {
  return new Promise((resolve) => {
    const body = JSON.stringify({ query, variables });
    const req = https.request({
      hostname: 'api.github.com', path: '/graphql', method: 'POST',
      headers: { 'User-Agent': 'MehrChain-Bot', 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      lookup: makeLookup(GITHUB_IPS[0]), servername: 'api.github.com'
    }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    });
    req.write(body); req.end();
  });
}
async function run() {
  const issueNumber = parseInt(process.argv[2] || '48', 10);
  const q = await graphql(`
    query {
      node(id: "PVT_kwHOAgpOTc4BkCJE") {
        ... on ProjectV2 {
          items(first: 50) {
            nodes {
              id
              content { ... on Issue { number } }
            }
          }
        }
      }
    }
  `);
  const item = q.data?.node?.items?.nodes?.find(i => i.content?.number === issueNumber);
  if (item) {
    console.log(`Found item for #${issueNumber}:`, item.id);
    await graphql(`
      mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
        updateProjectV2ItemFieldValue(
          input: {
            projectId: $projectId
            itemId: $itemId
            fieldId: $fieldId
            value: { singleSelectOptionId: $optionId }
          }
        ) { projectV2Item { id } }
      }
    `, {
      projectId: "PVT_kwHOAgpOTc4BkCJE",
      itemId: item.id,
      fieldId: "PVTSSF_lAHOAgpOTc4BkCJEzhi0Q2M",
      optionId: "47fc9ee4" // In progress
    });
    console.log(`Moved #${issueNumber} to "In progress"!`);
  } else {
    console.log(`Item #${issueNumber} not found.`);
  }
}
run();
