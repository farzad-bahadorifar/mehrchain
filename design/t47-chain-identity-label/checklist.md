# T47 v0.2 checklist

- [x] Current/proposed on the same username/name/missing/blank/long/Unicode/emoji fixtures.
- [x] All three proposed contexts and action labels contain no @, even in source values.
- [x] 320/390/544px frame caps in light/dark: 60 combinations, no app overflow/errors.
- [x] Missing and whitespace-only values resolve to Partner. Actions use that name.
- [x] No partner-email field or external request is required by the artifact.
- [x] Owner corrected the proposed identity rule: no @ in displayed name either.
- [x] Exact requested correction applied as v0.2, hash and decision in decisions.md.
- [x] Existing username save allowlist inspected in client, DTOs and server helper;
  actual helper rejects @ and unsupported punctuation. No account data rewritten.

Native buttons/selects have visible focus. Dismiss and context feedback are local
review actions. Native-device, screen-reader and full Unicode-script coverage
remain unverified; tested Unicode fixtures are synthetic. The static four-tab
navigation supplies product context rather than a redesign of those routes.
