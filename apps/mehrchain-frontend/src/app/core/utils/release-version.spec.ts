import { eligibleAndroidRelease, newerStableVersion } from './release-version';
import { APP_VERSION } from '../../../environments/app-version';

describe('release eligibility', () => {
  it.each([
    ['1.0.1', '1.0.0', true],
    ['1.10.0', '1.9.9', true],
    ['1.0.0', '1.0.0-rc.4', true],
    ['1.0.0', '1.0.0', false],
    ['0.9.9', '1.0.0', false],
    ['1.0.1-rc.1', '1.0.0', false],
    ['01.0.1', '1.0.0', false],
    ['oops', '1.0.0', false],
  ])('compares %s against %s', (next, current, expected) => {
    expect(newerStableVersion(next, current)).toBe(expected);
  });
  const valid = {
    version: '1.0.1',
    versionCode: 5,
    applicationId: APP_VERSION.applicationId,
    certificateSha256: 'b'.repeat(64),
    url: 'https://github.com/farzad-bahadorifar/mehrchain/releases/download/v1.0.1/mehrchain-release.apk',
    sha256: 'a'.repeat(64),
    size: 100,
  };
  it('requires a higher Android code as well as semantic version', () => {
    expect(eligibleAndroidRelease(valid, '1.0.0', 4, 'b'.repeat(64))).toBe(true);
    expect(eligibleAndroidRelease(valid, '1.0.0', 5, 'b'.repeat(64))).toBe(false);
  });
  it.each([
    { url: 'https://evil.test/mehrchain.apk' },
    { applicationId: 'com.mehrchain.app' },
    { applicationId: 'another.app' },
    { certificateSha256: 'c'.repeat(64) },
    { url: valid.url + '?redirect=evil' },
    { sha256: '' },
    { versionCode: 1.5 },
    { size: 0 },
  ])('rejects untrusted APK metadata %o', (change) => {
    expect(eligibleAndroidRelease({ ...valid, ...change }, '1.0.0', 4, 'b'.repeat(64))).toBe(false);
  });
});
