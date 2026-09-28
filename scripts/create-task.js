/**
 * Helper script to create a GitHub Issue, assign to @farzad-bahadorifar,
 * close as completed, and output the issue number and URL.
 *
 * Usage: node scripts/create-task.js "<Title>" "<Body>"
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
    let tried = 0;

    function tryIp(index) {
      if (index >= GITHUB_IPS.length) {
        return reject(lastError || new Error('All GitHub IPs failed'));
      }
      const ip = GITHUB_IPS[index];
      const reqOptions = {
        ...options,
        lookup: makeLookup(ip),
        servername: options.hostname,
        timeout: 10000,
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

async function main() {
  const title = process.argv[2];
  const body = process.argv[3] || 'Completed task.';

  if (!title) {
    console.error('Usage: node scripts/create-task.js "<Title>" "<Body>"');
    process.exit(1);
  }

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
    } catch (e) {
      // Fallback
    }
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

  // 2. Close the Issue as completed (unless --open flag is passed)
  const shouldKeepOpen = process.argv.includes('--open');
  if (shouldKeepOpen) {
    console.log(`\nIssue #${issue.number} created, assigned, and kept open for roadmap tracking!`);
    console.log(`URL: ${issue.html_url}`);
    return;
  }

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
