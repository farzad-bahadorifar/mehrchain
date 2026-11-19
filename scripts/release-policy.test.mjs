import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  stableRelease,
  validateRelease,
  assetUrl,
  APP_ID,
} from '../apps/mehrchain-frontend/release-policy.mjs';
import { onRequestGet } from '../apps/mehrchain-frontend/functions/updates/android.js';
import { onRequestGet as onRootRequestGet } from '../functions/updates/android.js';

const certificate = 'b'.repeat(64);
const manifest = {
  schemaVersion: 1,
  version: '1.0.1',
  versionCode: 5,
  applicationId: APP_ID,
  certificateSha256: certificate,
  sha256: 'a'.repeat(64),
  size: 100,
};
const release = {
  tag_name: 'v1.0.1',
  draft: false,
  prerelease: false,
  assets: [
    {
      name: 'mehrchain-release.apk',
      state: 'uploaded',
      size: 100,
      digest: `sha256:${manifest.sha256}`,
      browser_download_url: assetUrl('v1.0.1', 'mehrchain-release.apk'),
    },
    {
      name: 'release-manifest.json',
      state: 'uploaded',
      size: 300,
      browser_download_url: assetUrl('v1.0.1', 'release-manifest.json'),
    },
  ],
};
const originalFetch = globalThis.fetch;
const originalCaches = globalThis.caches;
test('repository-root Pages project exposes the same Android update handler', () => {
  assert.equal(onRootRequestGet, onRequestGet);
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  globalThis.caches = originalCaches;
});
test('accepts only a stable APK with matching identity, size, certificate and digest', () => {
  assert.equal(validateRelease(release, manifest, certificate).version, '1.0.1');
  for (const changed of [
    { applicationId: 'com.mehrchain.app' },
    { applicationId: 'wrong.app' },
    { certificateSha256: 'c'.repeat(64) },
    { sha256: 'd'.repeat(64) },
    { size: 101 },
    { version: '1.0.2' },
    { versionCode: 0 },
  ]) {
    assert.equal(validateRelease(release, { ...manifest, ...changed }, certificate), null);
  }
  assert.equal(validateRelease(release, manifest, ''), null);
  assert.equal(validateRelease({ ...release, assets: [] }, manifest, certificate), null);
});
test('rejects historical incorrectly marked RCs, previews, drafts and malformed tags', () => {
  for (const tag of ['v1.0.0-rc.3', 'v2.0.0-preview', 'v01.0.0', 'main', 'v1.0']) {
    assert.equal(stableRelease({ ...release, tag_name: tag }), false);
  }
  assert.equal(stableRelease({ ...release, draft: true }), false);
  assert.equal(stableRelease({ ...release, prerelease: true }), false);
});
const context = () => ({
  request: new Request('https://mehrchain.pages.dev/updates/android?ignored=1'),
  env: { ANDROID_SIGNING_CERT_SHA256: certificate },
  waitUntil: (promise) => promise,
});
const cache = () => {
  const values = new Map();
  return {
    default: {
      match: async (key) => values.get(key.url)?.clone(),
      put: async (key, value) => {
        values.set(key.url, value);
      },
    },
  };
};
test('endpoint caches public results, validates manifest and forwards no account headers', async () => {
  globalThis.caches = cache();
  let calls = 0;
  globalThis.fetch = async (url, options) => {
    calls++;
    assert.equal(options.headers.Authorization, undefined);
    return Response.json(url.includes('api.github.com') ? [release] : manifest);
  };
  const response = await onRequestGet(context());
  assert.equal((await response.json()).release.version, '1.0.1');
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), '*');
  await onRequestGet(context());
  assert.equal(calls, 2);
});
test('endpoint fails closed on missing signing identity, malformed and oversized metadata', async () => {
  globalThis.caches = cache();
  assert.equal((await onRequestGet({ ...context(), env: {} })).status, 503);
  globalThis.fetch = async () => new Response(' '.repeat(262145));
  assert.equal((await onRequestGet(context())).status, 503);
});
test('endpoint rate-limits failed upstream checks and never serves a debug fallback', async () => {
  globalThis.caches = cache();
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return new Response('', { status: 429 });
  };
  assert.equal((await onRequestGet(context())).status, 503);
  assert.equal((await onRequestGet(context())).status, 503);
  assert.equal(calls, 1);
});
