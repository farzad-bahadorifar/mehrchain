const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const {
  validateVersion,
  validatePublication,
  verifyApk,
  apkSigningCertificate,
} = require('./android-release.cjs');
const version = require('../app-version.json');
const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
});
test('shared version matches package metadata and classifies release tags', () => {
  assert.equal(validateVersion(`v${version.version}`).prerelease, version.version.includes('-'));
  assert.throws(() => validateVersion('v99.0.0'), /tag/);
});
test('official publication requires a pinned signing certificate', () => {
  assert.throws(() => verifyApk('missing.apk', '', '', ''), /certificate|identity|SHA256/);
});
test('reads the verified APK signer in older and newer Build Tools output', () => {
  const pin = 'a'.repeat(64);
  const other = 'b'.repeat(64);
  const v2 = `V2 Signer: certificate SHA-256 digest: ${pin}`;
  const v3 = `V3.0 Signer: certificate SHA-256 digest: ${pin}`;
  assert.equal(apkSigningCertificate(`Signer #1 certificate SHA-256 digest: ${pin}`), pin);
  assert.equal(
    apkSigningCertificate(`${v2}\n${v3}\nSource Stamp Signer certificate SHA-256 digest: ${other}`),
    pin,
  );
  assert.equal(apkSigningCertificate(`${v2}\n${v3.replace(pin, other)}`), undefined);
  assert.equal(apkSigningCertificate('APK signature output without a certificate'), undefined);
});
test('publication rejects an already published tag and non-increasing Android codes', async () => {
  global.fetch = async () => Response.json([{ tag_name: `v${version.version}` }]);
  await assert.rejects(validatePublication(`v${version.version}`, 'test/repo'), /already exists/);
  global.fetch = async (url) =>
    Response.json(
      url.includes('api.github.com')
        ? [
            {
              tag_name: 'v0.9.0',
              assets: [
                {
                  name: 'release-manifest.json',
                  size: 200,
                  browser_download_url:
                    'https://github.com/test/repo/releases/download/v0.9.0/release-manifest.json',
                },
              ],
            },
          ]
        : { versionCode: version.androidVersionCode },
    );
  await assert.rejects(
    validatePublication(`v${version.version}`, 'test/repo'),
    /versionCode must exceed/,
  );
});
