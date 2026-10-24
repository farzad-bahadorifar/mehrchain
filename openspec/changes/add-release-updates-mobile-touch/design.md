## Decisions

- One reviewed JSON version source feeds Android and the frontend; package versions
  are checked mirrors. Build-time SW appData is generated outside tracked files.
- A cacheable public Pages Function reads a fixed repository and validates release
  manifests against a pinned public certificate. Native installed identity is read
  through a minimal Capacitor plugin, preventing debug/different-key upgrade offers.
- Publication requires signature, identity, version and digest checks before public
  assets are attached. VersionCode history is checked in a serialized publication
  job. Signing material never reaches pull-request builds or frontend configuration.
- Web readiness and Android releases have distinct IDs/actions; local release notes
  cannot consume a pending upgrade. Consent precedes reloading or opening Android's
  browser/installer. Later is durable and scoped to the offered release.
- Mobile touch handling uses capability media queries and CSS scroll-axis policy,
  plus scoped Safari gesture events. The app has no text-size toolbar or persisted
  font override. Onboarding uses the same compact shell as authenticated routes,
  with viewport-sized hero spacing and natural scrolling only for taller content.
  No single-finger touch cancellation is needed.

## Risks and rollout

The release certificate must be configured in both GitHub and Pages. Missing or
inconsistent configuration fails closed. Browser/user policy can override zoom
restrictions. Signed installation/upgrade, native plugin runtime and phone keyboard
behavior require the physical-device matrix in `docs/t18_t19_review_handoff.md`.
The PR does not deploy, migrate data, create release tags or publish a release.
Rollback is a reviewed code revert/new release with a higher Android versionCode;
never rotate the established signing key or lower a distributed versionCode.
