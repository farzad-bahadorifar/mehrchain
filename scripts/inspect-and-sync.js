const https = require('https');
const fs = require('fs');

const GITHUB_IPS = ['140.82.121.6', '140.82.121.5', '140.82.113.6', '140.82.114.6', '140.82.112.6'];

function makeLookup(ip) {
  return function (hostname, options, cb) {
    if (typeof options === 'function') { cb = options; options = {}; }
    if (options && options.all) return cb(null, [{ address: ip, family: 4 }]);
    return cb(null, ip, 4);
  };
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
    console.error('No token provided');
    process.exit(1);
  }

  const query = `
    query {
      repository(owner: "farzad-bahadorifar", name: "mehrchain") {
        issues(first: 100, orderBy: {field: CREATED_AT, direction: ASC}) {
          totalCount
          nodes {
            id
            number
            title
            state
            stateReason
            closedAt
          }
        }
      }
      node(id: "PVT_kwHOAgpOTc4BkCJE") {
        ... on ProjectV2 {
          id
          title
          fields(first: 20) {
            nodes {
              ... on ProjectV2Field { id name }
              ... on ProjectV2SingleSelectField { id name options { id name } }
              ... on ProjectV2IterationField { id name configuration { iterations { id title startDate duration } } }
            }
          }
          items(first: 100) {
            totalCount
            nodes {
              id
              content {
                ... on Issue { id number title state stateReason }
                ... on DraftIssue { id title }
                ... on PullRequest { id number title state }
              }
              fieldValues(first: 20) {
                nodes {
                  ... on ProjectV2ItemFieldSingleSelectValue {
                    field { ... on ProjectV2SingleSelectField { name } }
                    name
                  }
                  ... on ProjectV2ItemFieldTextValue {
                    field { ... on ProjectV2Field { name } }
                    text
                  }
                  ... on ProjectV2ItemFieldDateValue {
                    field { ... on ProjectV2Field { name } }
                    date
                  }
                  ... on ProjectV2ItemFieldIterationValue {
                    field { ... on ProjectV2IterationField { name } }
                    title
                    startDate
                    duration
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const res = await graphql(query, {}, token);
  fs.writeFileSync('project-dump.json', JSON.stringify(res, null, 2));
  console.log('Project dump saved to project-dump.json');
}

main().catch(console.error);
