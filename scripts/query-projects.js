/**
 * Query GitHub projects for farzad-bahadorifar user
 */
const https = require('https');
const { execSync } = require('child_process');

function getToken() {
  let token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) {
    try {
      const psScript = `
Add-Type -TypeDefinition @"
using System; using System.Runtime.InteropServices; using System.Text;
public class WinCred3 {
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
    $p = [WinCred3]::GetPassword($t)
    if ($p) { Write-Output $p; break }
}
`;
      const encoded = Buffer.from(psScript, 'utf16le').toString('base64');
      const psOutput = execSync(`powershell -NoProfile -EncodedCommand ${encoded}`, { timeout: 8000 }).toString().trim();
      if (psOutput) token = psOutput;
    } catch (e) {}
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

function gql(query, token) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query });
    const req = https.request({
      hostname: 'api.github.com', path: '/graphql', method: 'POST',
      headers: {
        'User-Agent': 'MehrChain-Bot', 'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body),
      },
      lookup: (h, opts, cb) => {
        if (typeof opts === 'function') { cb = opts; opts = {}; }
        if (opts && opts.all) return cb(null, [{ address: '140.82.121.6', family: 4 }]);
        cb(null, '140.82.121.6', 4);
      },
      servername: 'api.github.com', timeout: 15000,
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(d); } });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const token = getToken();
  if (!token) { console.error('No token found'); process.exit(1); }
  console.log('Token found, querying projects...');

  const result = await gql(`
    query {
      user(login: "farzad-bahadorifar") {
        projectsV2(first: 20) {
          nodes { id title number }
        }
      }
    }
  `, token);

  console.log(JSON.stringify(result, null, 2));
}

main().catch(e => console.error(e));
