import { APP_VERSION } from '../../../environments/app-version';

export interface AndroidRelease {
  version: string;
  versionCode: number;
  applicationId: string;
  certificateSha256: string;
  url: string;
  sha256: string;
  size: number;
}

// Compare a stable candidate with a stable or prerelease running version.
export function newerStableVersion(candidate: string, current: string): boolean {
  const stable = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
  const running = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z.-]+))?$/;
  const next = stable.exec(candidate);
  const previous = running.exec(current);
  if (!next || !previous) return false;
  for (let index = 1; index <= 3; index++) {
    if (
      !Number.isSafeInteger(Number(next[index])) ||
      !Number.isSafeInteger(Number(previous[index]))
    )
      return false;
    if (Number(next[index]) !== Number(previous[index]))
      return Number(next[index]) > Number(previous[index]);
  }
  return Boolean(previous[4]);
}

export function eligibleAndroidRelease(
  value: unknown,
  version: string,
  code: number,
  certificate: string,
): value is AndroidRelease {
  if (!value || typeof value !== 'object') return false;
  const release = value as AndroidRelease;
  return (
    typeof release.version === 'string' &&
    newerStableVersion(release.version, version) &&
    Number.isSafeInteger(release.versionCode) &&
    release.versionCode > code &&
    release.versionCode <= 2100000000 &&
    release.applicationId === APP_VERSION.applicationId &&
    /^[a-f0-9]{64}$/.test(certificate) &&
    release.certificateSha256 === certificate &&
    release.url ===
      `https://github.com/farzad-bahadorifar/mehrchain/releases/download/v${release.version}/mehrchain-release.apk` &&
    /^[a-f0-9]{64}$/.test(release.sha256) &&
    Number.isSafeInteger(release.size) &&
    release.size > 0
  );
}
