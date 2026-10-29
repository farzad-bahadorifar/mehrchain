# V2 local implementation — 2026-10-29

Approval: owner explicitly approved V0.2 and requested implementation in the current
chat. Frozen artifact and hash: `design/ux/t22-profile-structure/decisions.md`.
This report concerns local code, not production deployment or real-phone acceptance.

## T26 — interface palette

- Approved light/dark background/foreground/card/primary/border/focus tokens applied
  in `apps/mehrchain-frontend/src/styles.css`. Profile milestone/reward roles and
  companion surface use the approved direction.
- Existing controls with hardcoded white-on-primary were bound to
  `text-primary-foreground`, including their hover/completed variants, to preserve
  readable foreground in the brighter dark palette. No habit/Chain/onboarding logic changed.
- Saved Mero colors remain separate from interface tokens. The compiled fixture
  retained selected `Royal Violet` in both themes; draft preview/cancel restored it.

## T27 — complete Profile navigation deliverable

- `/profile`: identity, actual Mero, four direct entries; no inline username/password
  form, full badge list or color editor.
- `/profile/account`: existing real username/password services, sign-out and
  separately confirmed account deletion.
- `/profile/badges`: existing five badge rules, All/Earned/Locked, details and empty
  filter state. No synthetic future badge rule was shipped.
- `/profile/colors`: real collection/capacity/slots, existing earning thresholds,
  saved names, preview-only Mero input, explicit Cancel preview and save/select flows.
  Failed input and request-confirmed success keep the prior session safeguards.
- `/profile/settings`: light/system/dark, real update/version/release-note controls.
- All destinations use the auth guard and visible Profile return link. Shared
  navigation remains active for Profile subroutes.

## T28 — username UI failure/cancel/removal

- Cancel restores saved username locally; blank Save cannot implicitly remove it.
- Remove opens a named confirmation explaining email/Google/account-data preservation.
- Username-save 404/405 becomes a short unavailable/retained-input message; numeric
  error status survives. An isolated 404 fixture visibly showed the new message.
- The existing real backend route problem is **not fixed or claimed fixed** by
  this presentation change. T29 retains that separate diagnosis and network blocker.

## Automated evidence

- `openspec validate implement-approved-profile-v2 --strict`: **passed**, executed
  through an ephemeral npx package without adding a repository dependency.

- `npx nx test mehrchain-frontend --watch=false`: **46 files / 271 tests passed**.
  Includes username conflict/debounce/session/removal, unavailable-route mapping,
  Mero preview reset, Profile rules/failed saves and actual route navigation harness.
- After the final Cancel button was connected through the rendered template:
  `npx nx test mehrchain-frontend --watch=false --include="**/features/profile/*.spec.ts"`:
  **2 files / 8 tests passed**. The cancellation regression clicks the rendered
  button, verifies saved selection/capacity and verifies no save/select service call.
- Final `npm run build:frontend`: production frontend build **passed**.
  Existing qrcode CommonJS optimization warning remains. This environment has no
  `GOOGLE_CLIENT_ID`; configure explicitly reports Google sign-in disabled for the
  local build. This bundle has not been deployed and is not auth/release acceptance.
- `node --test scripts/roadmap.spec.cjs`: **5 tests passed** for incomplete completion,
  immutable closed status, required blocker, duplicate IDs/issues, incomplete inputs,
  dependency cycles, unfinished-dependency execution, unchanged template placeholders
  and resolved-blocker cleanup.

## Compiled-browser inspection

Actual production-compiled Angular code was served through an **ignored local-only
QA helper**, with synthetic account/collection/history API responses. Its response
rewrites the API origin to loopback for this fixture only; product environment and
build output files are unchanged. No credentials, production data, live save,
migration or deployment were used.

Observed: compact overview; account destination; normalized failed save; deliberate
remove/keep flow; badges/details; colors draft `Ruby Glow · not saved` and Cancel
restoring `Royal Violet`; appearance theme switch; return to Profile in light mode.
The dark and light interface preserved the saved color independently of UI tokens.

Screenshot: [compiled Profile, synthetic data](profile-v2-local.png).

## T32 — task workflow

`tasks.json` owns status. CLI validation/rendering maintains active/task/completed
views, completion evidence and stable IDs; meaningful unit tests passed. A complete
workflow task was added through the documented `add --file --date` command. Root
AGENTS instructions and issue template point to this workflow. Legacy bulk GitHub
write scripts now refuse direct execution. No GitHub issue, Project, commit, push,
tag or Release was created/changed.

## Boundaries remaining

T29: live username-route root cause blocked by direct/proxy timeouts; source route
agreement is not runtime evidence. T30: actual Android Chrome/PWA keyboard/device
acceptance not executed. T31: future bounded Mero interaction analysis only. Old
operational acceptance is historical and release-policy requirements remain; it is
not quietly marked Done by retiring broad task definitions.
