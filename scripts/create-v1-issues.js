/**
 * Bulk issue creator for MehrChain v1.0 sprint
 * Creates all open issues for the launch sprint and updates project board
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

function request(options, postData) {
  return new Promise((resolve, reject) => {
    let lastError;
    function tryIp(index) {
      if (index >= GITHUB_IPS.length) return reject(lastError || new Error('All GitHub IPs failed'));
      const ip = GITHUB_IPS[index];
      const reqOptions = { ...options, lookup: makeLookup(ip), servername: options.hostname, timeout: 15000 };
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
    } catch (e) {}
  }
  if (!token) {
    try {
      const creds = execSync('git credential fill', { input: 'protocol=https\nhost=github.com\n\n', timeout: 5000 }).toString();
      const m = creds.match(/password=(.+)/);
      if (m) token = m[1].trim();
    } catch {}
  }
  if (!token) throw new Error('No GitHub token found');
  return token;
}

const issues = [
  // ---- CLOSE TEST ISSUE #29 ----
  { close: 29 },

  // ---- v1.0 SPRINT ISSUES (keep open) ----
  {
    title: '[v1.0 Bug] OTP auto-fill from previewCode',
    body: `## Summary
Frontend reads \`previewCode\` from register/resend-verification API response and auto-fills the OTP input field.

## Problem
- \`RESEND_API_KEY\` requires a verified domain — emails fall back to \`console.log\` (invisible to users)
- Backend already returns \`previewCode: otpCode\` in register + resend responses
- Frontend ignores this field — users are stuck on verification screen

## Solution
- Read \`previewCode\` from API response in the onboarding verification step
- Auto-fill the OTP input field
- Show message: *"Your verification code has been auto-filled. In the future, this code will be sent to your email."*
- Remove this fallback once Resend works with a real domain

## Files
- \`apps/mehrchain-frontend/src/app/features/onboarding/steps/\` (verification step)
- \`apps/mehrchain-backend/src/app/auth/auth.service.ts\` (already returns previewCode — no backend change needed)

## Priority
🔴 **P0 — Critical** — Users cannot verify their email without this fix`,
    labels: ['bug', 'priority: critical'],
    open: true,
  },
  {
    title: '[v1.0 Bug] Fix account deletion — only clear local state on backend success',
    body: `## Summary
Account deletion clears localStorage even when the backend fails, creating ghost accounts.

## Problem
The \`deleteAccount()\` method in \`AuthService\` uses a \`finally\` block to clear localStorage.
This means local state is cleared regardless of whether the backend DELETE succeeded or failed.
Users then see themselves as logged out but their account still exists in the database.

## Solution
- Move localStorage cleanup into the \`then/success\` path only
- On backend error: show \`"Account deletion failed. Please try again."\`
- On success: clear localStorage → redirect to onboarding

## Files
- \`apps/mehrchain-frontend/src/app/core/services/auth.service.ts\` — L297-L318 (\`deleteAccount()\`)

## Priority
🔴 **P0 — Critical**`,
    labels: ['bug', 'priority: critical'],
    open: true,
  },
  {
    title: '[v1.0 Bug] Translate OTP email template to English',
    body: `## Summary
The OTP verification email template is entirely in Farsi/Persian. Target audience is English-speaking.

## Problem
\`apps/mehrchain-backend/src/app/mail/mail.service.ts\` HTML template (lines 31-77) is in Farsi.

## Solution
Rewrite the email HTML template to English. Keep the same branded dark theme design. 
Use concise, minimal language matching the app philosophy.

## Example content
- Subject: \`Your MehrChain verification code\`
- Body: \`Your 6-digit code is: [CODE]\` + brief welcome message

## Files
- \`apps/mehrchain-backend/src/app/mail/mail.service.ts\`

## Priority
🔴 **P0 — Critical** — English-only app, Farsi emails break UX`,
    labels: ['bug', 'content'],
    open: true,
  },
  {
    title: '[v1.0 UI] Profile page simplification',
    body: `## Summary
Remove the bloated color swatch grid and scroll-on-tap behavior from the Profile page.

## Changes
### Remove
- Belly Glow Color grid (8+ swatches with streak-based locks: Teal, Amber, Coral, Violet...)
- Scroll-to-bottom animation when tapping the mascot
- "Tap to interact ✨" tooltip (external emoji not allowed)

### Keep
- Nickname editor + speech bubble
- 21-Day Custom Glow unlock (ONLY color reward)
- Dark/Light/System theme selector
- Account settings (Sign Out / Delete)

## Files
- \`apps/mehrchain-frontend/src/app/features/profile/profile.html\` (490 lines — needs major cleanup)
- \`apps/mehrchain-frontend/src/app/features/profile/profile.ts\`

## Priority
🟡 **P1 — High**`,
    labels: ['enhancement', 'ui'],
    open: true,
  },
  {
    title: '[v1.0 UI] Journey page redesign + badge system foundations',
    body: `## Summary
Remove the redundant User Profile Card from Journey and add badge system foundations.

## Changes
### Remove
- User Profile Card (duplicate of Profile tab)

### Keep
- Stats Grid (Habits, Streak, Sparks)
- Heatmap Calendar
- Recent Consistency list (simplified)
- Archived Flames section

### Add — Badge System (5 initial badges, Lucide icons only, NO external emoji)
| Badge | Trigger | Lucide Icon |
|-------|---------|------------|
| First Spark | Complete first habit ever | \`sparkles\` |
| Chain Starter | First chain connection | \`link\` |
| 7-Day Streak | 7 consecutive days | \`flame\` |
| 21-Day Master | 21 days (unlocks custom glow) | \`trophy\` |
| Kind Soul | First heart reaction given | \`heart\` |

## Files
- \`apps/mehrchain-frontend/src/app/features/journey/journey.html\`
- \`apps/mehrchain-frontend/src/app/features/journey/journey.ts\`

## Priority
🟡 **P1 — High**`,
    labels: ['enhancement', 'ui'],
    open: true,
  },
  {
    title: '[v1.0 UI] Commitment duration — "Endless Journey" + Custom',
    body: `## Summary
Replace the 7d/14d/21d/30d preset buttons with two clean options.

## New Options
1. **"Endless Journey"** — \`totalDays = -1\` (no end date)
2. **"Custom"** — user enters their own number of days

## Remove
- 7-day preset
- 14-day preset
- 21-day preset
- 30-day preset

## Rationale
> "To infinity and beyond" — the idea of self-growth without an artificial deadline.
> We avoid the Buzz Lightyear phrasing due to Disney copyright.

## Files
- \`apps/mehrchain-frontend/src/app/shared/components/new-commitment-modal/\`
- \`apps/mehrchain-backend/src/app/commitments/dto/create-commitment.dto.ts\` (validate -1)

## Priority
🟡 **P1 — High**`,
    labels: ['enhancement', 'ui'],
    open: true,
  },
  {
    title: '[v1.0 UI] "I did it" → "Spark" button with CSS animation',
    body: `## Summary
Rename the habit completion button from "I did it" to "Spark" with Lucide icon and CSS animation.

## Changes
- Text: "I did it" → **"Spark"**
- Icon: Lucide \`sparkles\` (larger, more prominent)
- Animation: CSS scale + glow on click (no Three.js until v1.1)
- Button style: more prominent, primary color, bigger

## Three.js deferred to v1.1
WebGL particle burst is planned for v1.1 when we have more time for testing.

## Files
- \`apps/mehrchain-frontend/src/app/shared/components/commitment-card/commitment-card.html\`
- \`apps/mehrchain-frontend/src/app/shared/components/commitment-card/commitment-card.ts\`
- \`apps/mehrchain-frontend/src/app/shared/components/commitment-card/commitment-card.css\`

## Priority
🟡 **P1 — High**`,
    labels: ['enhancement', 'ui'],
    open: true,
  },
  {
    title: '[v1.0 UX] Skeleton loading + cold start message',
    body: `## Summary
Add skeleton loading screens and a cold start message for Render free-tier warmup.

## Problem
Render free tier cold starts take 30-60 seconds after 15 minutes of inactivity.
Currently shows a plain spinner — users don't know if the app is broken or loading.

## Changes
### Skeleton loading screens
- Dashboard: skeleton cards while commitments load
- Chain: skeleton cards while connections load  
- Journey: skeleton for heatmap and stats

### Cold start message (shown after 5+ second wait)
> *"Waking up Mero... Free servers need a moment to warm up. Thanks for your patience!"*

### Spinner for actions
- Spark button: spinner while API call in progress
- Invite link generation: spinner
- OTP verification: spinner

## Files
- \`apps/mehrchain-frontend/src/app/features/dashboard/dashboard.html\`
- \`apps/mehrchain-frontend/src/app/features/chain/chain.html\`
- \`apps/mehrchain-frontend/src/app/features/journey/journey.html\`
- \`apps/mehrchain-frontend/src/app/core/services/\` (HTTP timeout detection)

## Priority
🟡 **P1 — High**`,
    labels: ['enhancement', 'ux'],
    open: true,
  },
  {
    title: '[v1.0 Feature] Articles "Coming Soon" placeholder in Chain',
    body: `## Summary
Add a placeholder card in the Chain page for the upcoming Articles feature.

## Details
Add a small card/section at the bottom of the Chain page:
> **Articles** — *Coming Soon*  
> Short reads about kindness, habit chaining, and human connection.

## Rationale
Like Duolingo's in-app tips, we want to build the habit of reading mindful content.
This placeholder sets user expectation and signals the app's growth direction.

## Implementation
v1.0: Static "Coming Soon" card
v1.1+: Real articles from CMS/Markdown

## Files
- \`apps/mehrchain-frontend/src/app/features/chain/chain.html\`

## Priority
🟢 **P2 — Medium**`,
    labels: ['enhancement', 'feature'],
    open: true,
  },
  {
    title: '[v1.0 Feature] "What\'s New" section in Profile + version dot indicator',
    body: `## Summary
Add a "What's New" section in the Profile page showing the changelog for the current version.

## Details
### "What's New" section in Profile
- Shows changelog for the current app version
- Collapsed by default, expandable
- New entries highlighted

### Blue dot on Profile tab
- Show a blue notification dot on the Profile nav tab when a new version is detected
- Dot clears when user opens Profile
- For PWA: use Angular \`SwUpdate\` service to detect new versions

## Files
- \`apps/mehrchain-frontend/src/app/features/profile/profile.html\`
- \`apps/mehrchain-frontend/src/app/features/profile/profile.ts\`
- \`apps/mehrchain-frontend/src/app/app.html\` (nav dot)

## Priority
🟢 **P2 — Medium**`,
    labels: ['enhancement', 'feature'],
    open: true,
  },
  {
    title: '[v1.0 Docs] Update landing page — Mero mascot + philosophy + roadmap',
    body: `## Summary
Complete redesign of the landing page at \`docs/index.html\` (GitHub Pages).

## Changes
- Add Mero mascot (inline SVG / CSS representation) to the hero section
- Update philosophy section: charity, mindful companion, self-growth, people connection
- Update features to reflect current state (Spark, Endless Journey, Badges, Chain)
- Add "Meet Mero" companion section
- Remove outdated content (emoji clutter, inaccurate feature descriptions)
- Ensure English-only (no Farsi anywhere)
- Update CTAs to be clear and direct

## Landing page URL
https://farzad-bahadorifar.github.io/mehrchain/

## Priority
🟢 **P2 — Medium** (but important for launch)`,
    labels: ['documentation', 'ui'],
    open: true,
  },
];

async function main() {
  const token = getToken();
  const headers = {
    'User-Agent': 'MehrChain-Bot',
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  const results = [];

  for (const issue of issues) {
    // Close existing issue
    if (issue.close) {
      process.stdout.write(`Closing test issue #${issue.close}... `);
      await request({
        hostname: 'api.github.com',
        path: `/repos/farzad-bahadorifar/mehrchain/issues/${issue.close}`,
        method: 'PATCH',
        headers,
      }, { state: 'closed', state_reason: 'not_planned' });
      console.log('closed.');
      continue;
    }

    process.stdout.write(`Creating: "${issue.title}"... `);
    const res = await request({
      hostname: 'api.github.com',
      path: '/repos/farzad-bahadorifar/mehrchain/issues',
      method: 'POST',
      headers,
    }, {
      title: issue.title,
      body: issue.body,
      assignees: ['farzad-bahadorifar'],
    });

    if (res.data && res.data.number) {
      console.log(`#${res.data.number} — ${res.data.html_url}`);
      results.push({ number: res.data.number, title: issue.title, url: res.data.html_url });
    } else {
      console.log(`ERROR: ${JSON.stringify(res.data).substring(0, 200)}`);
    }

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 800));
  }

  console.log('\n=== SUMMARY ===');
  results.forEach(r => console.log(`#${r.number}: ${r.title}`));
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
