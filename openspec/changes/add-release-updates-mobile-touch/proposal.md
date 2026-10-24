# Change: T18 release updates and T19 mobile touch policy

## Why

Installed Android builds cannot discover a later release, official publication can
fall back to debug binaries, and mobile forms/gestures can change the page scale.

## What Changes

- Discover stable signed Android releases through a bounded public Pages endpoint.
- Separate consent-based APK downloads, web reload offers, and local release notes.
- Use one version source and verify identity, certificate, versions and checksums
  before official publication; classify release candidates as prereleases.
- Apply a mobile touch policy preserving scrolling and desktop zoom, correct small
  form fonts, reject multi-touch swipes, and fit each device in a compact app shell.
  No app-specific text-size control is requested or provided.

## Impact

- Frontend, Pages release discovery, Android version configuration and APK workflow.
- No database, backend contract, production deployment or release publication.

## Authorization

The owner explicitly requested implementation, a branch from main, commits and a
pull request for T18/T19 in this chat. This approves the task scope above. Physical
device acceptance and signing configuration remain separately recorded gates.

On October 24 the owner explicitly corrected T19: remove the Text size feature,
fit mobile viewports, retain a mobile-width desktop PWA shell and prevent mobile
page zoom where supported. This correction supersedes the earlier resizing scope.
