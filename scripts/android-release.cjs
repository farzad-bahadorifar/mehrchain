const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const metadata = require('../app-version.json');
const pkg = require('../package.json');
const semver = require('semver');

function validateVersion(tag) {
  if (
    !semver.valid(metadata.version) ||
    pkg.version !== metadata.version ||
    require('../package-lock.json').version !== metadata.version ||
    !Number.isSafeInteger(metadata.androidVersionCode) ||
    metadata.androidVersionCode <= 1 ||
    metadata.androidVersionCode > 2100000000 ||
    metadata.applicationId !== 'com.mehrchain.mobile'
  ) {
    throw new Error('Invalid or inconsistent app-version.json/package metadata');
  }
  if (tag && tag !== `v${metadata.version}`)
    throw new Error('Release tag must match app-version.json');
  return { ...metadata, prerelease: semver.prerelease(metadata.version) !== null };
}

async function readJson(url, headers = {}, limit = 1024 * 1024) {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`Release request failed (${response.status})`);
  const text = await response.text();
  if (Buffer.byteLength(text) > limit) throw new Error('Release response too large');
  return JSON.parse(text);
}

async function validatePublication(tag, repository) {
  if (!tag) throw new Error('A matching version_tag is required for publication');
  validateVersion(tag);
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'MehrChain-Release' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  let maximumCode = 1; // Historical rc1–rc3 used versionCode 1.
  for (let page = 1; page <= 10; page++) {
    const releases = await readJson(
      `https://api.github.com/repos/${repository}/releases?per_page=100&page=${page}`,
      headers,
    );
    if (!Array.isArray(releases)) throw new Error('Invalid release listing');
    for (const release of releases) {
      if (release.tag_name === tag)
        throw new Error('Release already exists; use a new version and versionCode');
      if (release.draft) continue;
      const asset = release.assets?.find((item) => item.name === 'release-manifest.json');
      if (!asset) continue;
      const expected = `https://github.com/${repository}/releases/download/${encodeURIComponent(release.tag_name)}/release-manifest.json`;
      if (asset.browser_download_url !== expected || asset.size > 8192)
        throw new Error('Invalid historical manifest asset');
      const manifest = await readJson(expected, {}, 8192);
      if (!Number.isSafeInteger(manifest.versionCode))
        throw new Error('Invalid historical versionCode');
      maximumCode = Math.max(maximumCode, manifest.versionCode);
    }
    if (releases.length < 100) {
      if (metadata.androidVersionCode <= maximumCode)
        throw new Error(`versionCode must exceed ${maximumCode}`);
      return;
    }
  }
  throw new Error('Release history exceeds verification bound; review versionCode manually');
}

function verifyApk(apk, tools, analyzer, expectedCertificate) {
  validateVersion();
  const certificate = (expectedCertificate || '').toLowerCase().replace(/:/g, '');
  if (!/^[a-f0-9]{64}$/.test(certificate))
    throw new Error('Pinned ANDROID_SIGNING_CERT_SHA256 is required');
  const run = (command, args) => execFileSync(command, args, { encoding: 'utf8' }).trim();
  run(path.join(tools, 'zipalign'), ['-c', '-p', '4', apk]);
  const verification = run(path.join(tools, 'apksigner'), [
    'verify',
    '--verbose',
    '--print-certs',
    apk,
  ]);
  const fingerprints = [
    ...verification.matchAll(/Signer #\d+ certificate SHA-256 digest: ([a-fA-F0-9]+)/g),
  ];
  if (fingerprints.length !== 1 || fingerprints[0][1].toLowerCase() !== certificate) {
    throw new Error('APK certificate does not match the pinned release identity');
  }
  for (const [field, expected] of [
    ['application-id', metadata.applicationId],
    ['version-name', metadata.version],
    ['version-code', String(metadata.androidVersionCode)],
    ['debuggable', 'false'],
  ]) {
    if (run(analyzer, ['manifest', field, apk]) !== expected)
      throw new Error(`APK ${field} mismatch`);
  }
  const bytes = fs.readFileSync(apk);
  const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
  const manifest = {
    schemaVersion: 1,
    version: metadata.version,
    versionCode: metadata.androidVersionCode,
    applicationId: metadata.applicationId,
    certificateSha256: certificate,
    sha256,
    size: bytes.length,
  };
  fs.writeFileSync(
    path.join(path.dirname(apk), 'release-manifest.json'),
    JSON.stringify(manifest, null, 2) + '\n',
  );
  fs.writeFileSync(
    path.join(path.dirname(apk), 'SHA256SUMS'),
    `${sha256}  mehrchain-release.apk\n`,
  );
}

module.exports = { validateVersion, validatePublication, verifyApk };
if (require.main === module) {
  (async () => {
    const [mode, ...args] = process.argv.slice(2);
    if (mode === 'validate') {
      const version = validateVersion(args[0]);
      if (process.env.GITHUB_OUTPUT)
        fs.appendFileSync(
          process.env.GITHUB_OUTPUT,
          `tag=v${version.version}\nprerelease=${version.prerelease}\n`,
        );
      console.log(
        `Validated v${version.version} (Android ${version.androidVersionCode}, prerelease=${version.prerelease})`,
      );
    } else if (mode === 'publication') await validatePublication(...args);
    else if (mode === 'verify') verifyApk(...args, process.env.ANDROID_SIGNING_CERT_SHA256);
    else throw new Error('Expected validate, publication or verify');
  })().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
