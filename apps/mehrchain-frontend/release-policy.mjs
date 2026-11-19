export const REPOSITORY = 'farzad-bahadorifar/mehrchain';
export const APP_ID = 'com.mehrchain.mobile';
export const STABLE_VERSION = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const SHA256 = /^[a-f0-9]{64}$/;

export function stableRelease(release) {
  return (
    release &&
    release.draft === false &&
    release.prerelease === false &&
    typeof release.tag_name === 'string' &&
    STABLE_VERSION.test(release.tag_name.replace(/^v/, ''))
  );
}

export function assetUrl(tag, name) {
  return `https://github.com/${REPOSITORY}/releases/download/${encodeURIComponent(tag)}/${name}`;
}

export function validateRelease(release, manifest, certificate) {
  if (!stableRelease(release) || !SHA256.test(certificate || '')) return null;
  const version = release.tag_name.replace(/^v/, '');
  const apk = release.assets?.find((a) => a.name === 'mehrchain-release.apk');
  if (
    !manifest ||
    manifest.schemaVersion !== 1 ||
    manifest.version !== version ||
    manifest.applicationId !== APP_ID ||
    manifest.certificateSha256 !== certificate ||
    !Number.isSafeInteger(manifest.versionCode) ||
    manifest.versionCode < 1 ||
    manifest.versionCode > 2100000000 ||
    !SHA256.test(manifest.sha256 || '') ||
    !apk ||
    apk.state !== 'uploaded' ||
    !Number.isSafeInteger(apk.size) ||
    apk.size < 1 ||
    apk.browser_download_url !== assetUrl(release.tag_name, 'mehrchain-release.apk') ||
    apk.digest !== `sha256:${manifest.sha256}` ||
    apk.size !== manifest.size
  )
    return null;
  return {
    version,
    versionCode: manifest.versionCode,
    applicationId: APP_ID,
    certificateSha256: certificate,
    url: apk.browser_download_url,
    sha256: manifest.sha256,
    size: apk.size,
  };
}
