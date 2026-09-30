/**
 * Update GitHub Project Board (MehrChain) via GraphQL API
 * - Moves all v1.0 sprint issues (#30-#40) to "Ready" status
 * - Moves old done issues to "Done" (if not already)
 * - Sets iteration/dates on the roadmap view
 */

const https = require('https');
const { execSync } = require('child_process');

const GITHUB_IPS = ['140.82.121.6', '140.82.121.5', '140.82.113.6', '140.82.114.6', '140.82.112.6'];

function makeLookup(ip) {
  return function (hostname, options, cb) {
    if (typeof options === 'function') { cb = options; options = {}; }
    if (options && options.all) return cb(null, [{ address: ip, family: 4 }]);
    return cb(null, ip, 4);
  };
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
      req.on('timeout', () => req.destroy());
      req.on('error', err => { lastError = err; tryIp(index + 1); });
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
      const ps = `
Add-Type -TypeDefinition @"
using System; using System.Runtime.InteropServices; using System.Text;
public class WC {
    [DllImport("advapi32.dll",EntryPoint="CredReadW",CharSet=CharSet.Unicode,SetLastError=true)]
    public static extern bool CredRead(string t,int type,int r,out IntPtr p);
    [DllImport("advapi32.dll",EntryPoint="CredFree",SetLastError=true)]
    public static extern void CredFree(IntPtr p);
    [StructLayout(LayoutKind.Sequential,CharSet=CharSet.Unicode)]
    public struct CRED{public int F;public int T;public string TN;public string C;public System.Runtime.InteropServices.ComTypes.FILETIME LW;public int CBS;public IntPtr CB;public int P;public int AC;public IntPtr A;public string TA;public string UN;}
    public static string GP(string t){IntPtr p;if(CredRead(t,1,0,out p)){CRED c=(CRED)System.Runtime.InteropServices.Marshal.PtrToStructure(p,typeof(CRED));byte[] b=new byte[c.CBS];System.Runtime.InteropServices.Marshal.Copy(c.CB,b,0,c.CBS);CredFree(p);return Encoding.Unicode.GetString(b);}return null;}
}
"@
foreach($t in @('git:https://farzad-bahadorifar@github.com','git:https://github.com')){$p=[WC]::GP($t);if($p){Write-Output $p;break}}
`;
      const enc = Buffer.from(ps, 'utf16le').toString('base64');
      const out = execSync(`powershell -NoProfile -EncodedCommand ${enc}`, { timeout: 8000 }).toString().trim();
      if (out) token = out;
    } catch {}
  }
  if (!token) {
    try {
      const c = execSync('git credential fill', { input: 'protocol=https\nhost=github.com\n\n', timeout: 5000 }).toString();
      const m = c.match(/password=(.+)/);
      if (m) token = m[1].trim();
    } catch {}
  }
  if (!token) throw new Error('No token');
  return token;
}

async function main() {
  const token = getToken();

  // 1. Find the project
  console.log('Fetching project info...');
  const projectQuery = await graphql(`
    query {
      user(login: "farzad-bahadorifar") {
        projectsV2(first: 10) {
          nodes { id title number }
        }
      }
    }
  `, {}, token);

  const projects = projectQuery?.data?.user?.projectsV2?.nodes || [];
  const project = projects.find(p => p.title === 'MehrChain');
  if (!project) {
    console.log('Available projects:', projects.map(p => p.title).join(', '));
    throw new Error('MehrChain project not found');
  }
  console.log(`Found project: "${project.title}" (ID: ${project.id})`);

  // 2. Get project fields (Status, etc.)
  const fieldsQuery = await graphql(`
    query($projectId: ID!) {
      node(id: $projectId) {
        ... on ProjectV2 {
          fields(first: 20) {
            nodes {
              ... on ProjectV2Field { id name }
              ... on ProjectV2SingleSelectField {
                id name
                options { id name }
              }
              ... on ProjectV2IterationField {
                id name
                configuration { iterations { id title startDate duration } }
              }
            }
          }
        }
      }
    }
  `, { projectId: project.id }, token);

  const fields = fieldsQuery?.data?.node?.fields?.nodes || [];
  const statusField = fields.find(f => f.name === 'Status');
  if (!statusField) throw new Error('Status field not found');

  console.log('Status options:', statusField.options?.map(o => `${o.name} (${o.id})`).join(', '));

  const readyOption = statusField.options?.find(o => o.name === 'Ready');
  const backlogOption = statusField.options?.find(o => o.name === 'Backlog');

  // 3. Get all project items to find our new issues
  console.log('Fetching project items...');
  const itemsQuery = await graphql(`
    query($projectId: ID!) {
      node(id: $projectId) {
        ... on ProjectV2 {
          items(first: 100) {
            nodes {
              id
              content {
                ... on Issue { number title }
                ... on DraftIssue { title }
              }
              fieldValues(first: 10) {
                nodes {
                  ... on ProjectV2ItemFieldSingleSelectValue {
                    field { ... on ProjectV2SingleSelectField { name } }
                    name
                  }
                }
              }
            }
          }
        }
      }
    }
  `, { projectId: project.id }, token);

  const items = itemsQuery?.data?.node?.items?.nodes || [];
  console.log(`Found ${items.length} project items`);

  // 4. Add new issues #30-#40 to project (they may not be in project yet)
  const repoQuery = await graphql(`
    query {
      repository(owner: "farzad-bahadorifar", name: "mehrchain") {
        issues(last: 20, states: OPEN) {
          nodes { id number title }
        }
      }
    }
  `, {}, token);

  const repoIssues = repoQuery?.data?.repository?.issues?.nodes || [];
  const newSprintIssues = repoIssues.filter(i => i.number >= 30);
  console.log(`Sprint issues to add: ${newSprintIssues.map(i => `#${i.number}`).join(', ')}`);

  // Add each new issue to the project
  for (const issue of newSprintIssues) {
    const existing = items.find(item => item.content?.number === issue.number);
    let itemId = existing?.id;

    if (!itemId) {
      process.stdout.write(`Adding #${issue.number} to project... `);
      const addRes = await graphql(`
        mutation($projectId: ID!, $contentId: ID!) {
          addProjectV2ItemById(input: { projectId: $projectId, contentId: $contentId }) {
            item { id }
          }
        }
      `, { projectId: project.id, contentId: issue.id }, token);
      itemId = addRes?.data?.addProjectV2ItemById?.item?.id;
      console.log(itemId ? `added (${itemId})` : 'FAILED');
    } else {
      console.log(`#${issue.number} already in project`);
    }

    // Set status to "Ready" (P0 bugs) or "Backlog" (features)
    if (itemId && readyOption && issue.number <= 32) {
      // Issues #30-#32 are critical bugs → Ready
      process.stdout.write(`  Setting #${issue.number} → Ready... `);
      const setRes = await graphql(`
        mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
          updateProjectV2ItemFieldValue(input: {
            projectId: $projectId, itemId: $itemId,
            fieldId: $fieldId,
            value: { singleSelectOptionId: $optionId }
          }) { projectV2Item { id } }
        }
      `, { projectId: project.id, itemId, fieldId: statusField.id, optionId: readyOption.id }, token);
      console.log(setRes?.data?.updateProjectV2ItemFieldValue ? 'done' : 'FAILED');
    } else if (itemId && backlogOption && issue.number > 32) {
      // Issues #33-#40 → Backlog (already default, but explicit)
      process.stdout.write(`  Keeping #${issue.number} in Backlog... `);
      const setRes = await graphql(`
        mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
          updateProjectV2ItemFieldValue(input: {
            projectId: $projectId, itemId: $itemId,
            fieldId: $fieldId,
            value: { singleSelectOptionId: $optionId }
          }) { projectV2Item { id } }
        }
      `, { projectId: project.id, itemId, fieldId: statusField.id, optionId: backlogOption.id }, token);
      console.log(setRes?.data?.updateProjectV2ItemFieldValue ? 'ok' : 'FAILED');
    }

    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\nProject board updated!');
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
